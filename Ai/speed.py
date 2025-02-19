from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydub import AudioSegment
import webrtcvad
import os
import tempfile
import asyncio
from concurrent.futures import ThreadPoolExecutor
import logging
from functools import lru_cache

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 스레드 풀 생성
thread_pool = ThreadPoolExecutor(max_workers=4)

@lru_cache(maxsize=128)
def get_speech_rate(duration: float) -> str:
    """
    음성 세그먼트의 길이에 따른 말하기 속도 분류 (5단계)
    - 매우 빠름: 1초 미만
    - 빠름: 1초 이상 1.5초 미만
    - 보통: 1.5초 이상 2.5초 이하
    - 느림: 2.5초 초과 3초 이하
    - 매우 느림: 3초 초과
    """
    if duration < 1.0:
        return "매우 빠름"
    elif duration < 1.5:
        return "빠름"
    elif duration <= 2.5:
        return "보통"
    elif duration <= 3.0:
        return "느림"
    else:
        return "매우 느림"

# VAD 처리를 위한 프레임 클래스
class Frame:
    def __init__(self, bytes, timestamp, duration):
        self.bytes = bytes
        self.timestamp = timestamp
        self.duration = duration

def frame_generator(frame_duration_ms, audio_bytes, sample_rate, sample_width):
    """
    고정 길이(밀리초)로 오디오 바이트를 분할하여 프레임을 생성
    """
    n = int(sample_rate * (frame_duration_ms / 1000.0) * sample_width)
    offset = 0
    timestamp = 0.0
    duration = frame_duration_ms / 1000.0
    while offset + n <= len(audio_bytes):
        yield Frame(audio_bytes[offset:offset+n], timestamp, duration)
        timestamp += duration
        offset += n

def vad_collector(sample_rate, frame_duration_ms, padding_duration_ms, frames, vad):
    """
    VAD를 이용해 음성이 검출된 프레임들을 모아 연속된 음성 구간(세그먼트)으로 묶습니다.
    padding_duration_ms는 비음성 프레임이 나타나면 즉시 구간 종료를 위해 사용됩니다.
    """
    triggered = False
    voiced_frames = []
    segments = []
    for frame in frames:
        is_speech = vad.is_speech(frame.bytes, sample_rate)
        if not triggered:
            if is_speech:
                triggered = True
                voiced_frames.append(frame)
        else:
            if not is_speech:
                segments.append(voiced_frames)
                voiced_frames = []
                triggered = False
            else:
                voiced_frames.append(frame)
    if voiced_frames:
        segments.append(voiced_frames)
    return segments

async def process_segment_vad(segment_frames, index, original_audio):
    """
    VAD로 검출된 프레임 그룹(세그먼트)의 시작과 종료 시간을 계산하고,
    pydub를 이용해 해당 세그먼트의 볼륨(dBFS)을 측정합니다.
    """
    # 시작/종료 시각(초)
    start_time = segment_frames[0].timestamp
    end_time = segment_frames[-1].timestamp + segment_frames[-1].duration
    duration = end_time - start_time
    
    start_ms = int(start_time * 1000)
    end_ms = int(end_time * 1000)
    segment_audio = original_audio[start_ms:end_ms]
    
    volume = await asyncio.get_event_loop().run_in_executor(
        thread_pool,
        lambda: segment_audio.dBFS
    )
    
    return {
        "segment": index,
        "start_time": start_time,  # 시작 시각 (초)
        "end_time": end_time,      # 종료 시각 (초)
        "duration": duration,      # 구간 길이 (초)
        "volume": volume,
        "rate": get_speech_rate(duration)
    }

async def analyze_segments_vad(audio: AudioSegment) -> list:
    """
    업로드된 오디오 파일을 VAD 기반으로 분석한 뒤,
    1) 세그먼트 정보를 비동기로 수집하고,
    2) 1초 미만 구간을 다음 구간과 병합(merge)하거나, 마지막이라 병합 불가하면 제외합니다.
    """
    # 오디오를 모노, 16kHz, 16bit PCM으로 변환
    audio = audio.set_channels(1)
    audio = audio.set_frame_rate(16000)
    audio = audio.set_sample_width(2)
    sample_rate = audio.frame_rate
    sample_width = audio.sample_width
    audio_bytes = audio.raw_data

    vad = webrtcvad.Vad(2)  # 0(덜 공격적) ~ 3(매우 공격적)
    frame_duration_ms = 30
    padding_duration_ms = 300

    frames = list(frame_generator(frame_duration_ms, audio_bytes, sample_rate, sample_width))
    segments_frames = vad_collector(sample_rate, frame_duration_ms, padding_duration_ms, frames, vad)

    # 비동기로 각 세그먼트 처리
    tasks = [
        process_segment_vad(segment_frames, i, audio)
        for i, segment_frames in enumerate(segments_frames, 1)
    ]
    results = await asyncio.gather(*tasks)

    # 1초 미만 구간을 후속 구간과 병합(merge)하거나 병합 불가 시 제외하는 로직
    # 1) 시작 시간을 기준으로 정렬 (혹시라도 순서가 뒤죽박죽일 수 있으므로)
    results = sorted(results, key=lambda r: r["start_time"])

    merged_results = []
    i = 0
    while i < len(results):
        current = results[i]
        # 현재 구간이 1초 미만이면
        if current["duration"] < 1.0:
            # 다음 구간이 존재한다면 다음 구간과 병합
            if i < len(results) - 1:
                next_seg = results[i + 1]
                new_start = current["start_time"]
                new_end = next_seg["end_time"]
                new_duration = new_end - new_start
                total_dur = current["duration"] + next_seg["duration"]

                # 볼륨은 가중 평균(길이에 비례)으로 계산 (단순화)
                new_volume = (
                    current["volume"] * current["duration"]
                    + next_seg["volume"] * next_seg["duration"]
                ) / total_dur

                new_rate = get_speech_rate(new_duration)

                # 구간 번호는 예시로 "1-2" 처럼 병합 표시 (원하는 방식으로 변경 가능)
                merged_segment = {
                    "segment": f"{current['segment']}-{next_seg['segment']}",
                    "start_time": new_start,
                    "end_time": new_end,
                    "duration": new_duration,
                    "volume": new_volume,
                    "rate": new_rate,
                }
                merged_results.append(merged_segment)
                # 다음 구간은 이미 병합했으므로 건너뛰기
                i += 2
            else:
                # 마지막 구간이 1초 미만이라 병합 불가 → 제외(추가하지 않음)
                i += 1
        else:
            # 1초 이상이면 그대로 추가
            merged_results.append(current)
            i += 1

    return merged_results

@app.post("/upload-audio")
async def process_audio(audio: UploadFile = File(...)):
    try:
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            content = await audio.read()
            temp_file.write(content)
            temp_path = temp_file.name
        
        try:
            audio_segment = AudioSegment.from_file(temp_path)
            results = await analyze_segments_vad(audio_segment)
            return {"results": results}
        except Exception as e:
            logger.error(f"오디오 처리 중 오류 발생: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            os.unlink(temp_path)
    except Exception as e:
        logger.error(f"파일 업로드 중 오류 발생: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.on_event("shutdown")
async def shutdown_event():
    thread_pool.shutdown(wait=True)
