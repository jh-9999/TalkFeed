# vad로 한거
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
    - 약간 빠름: 1초 이상 1.5초 미만
    - 보통: 1.5초 이상 2.5초 이하
    - 약간 느림: 2.5초 초과 3초 이하
    - 매우 느림: 3초 초과
    """
    if duration < 1.0:
        return "매우 빠름"
    elif duration < 1.5:
        return "약간 빠름"
    elif duration <= 2.5:
        return "보통"
    elif duration <= 3.0:
        return "약간 느림"
    else:
        return "매우 느림"

# VAD 처리를 위한 프레임 클래스
class Frame:
    def __init__(self, bytes, timestamp, duration):
        self.bytes = bytes
        self.timestamp = timestamp
        self.duration = duration

def frame_generator(frame_duration_ms, audio_bytes, sample_rate, sample_width):
    """고정 길이(밀리초)로 오디오 바이트를 분할하여 프레임을 생성"""
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
        "duration": duration,
        "volume": volume,
        "rate": get_speech_rate(duration)
    }

async def analyze_segments_vad(audio: AudioSegment) -> list:
    """
    업로드된 오디오 파일을 VAD 기반으로 분석합니다.
    오디오를 webrtcvad에서 요구하는 형식(모노, 16kHz, 16비트 PCM)으로 변환한 후,
    프레임 단위로 분할하고 음성 구간을 검출합니다.
    """
    audio = audio.set_channels(1)
    audio = audio.set_frame_rate(16000)
    audio = audio.set_sample_width(2)
    sample_rate = audio.frame_rate
    sample_width = audio.sample_width
    audio_bytes = audio.raw_data

    vad = webrtcvad.Vad(2)  # 0(덜 공격적)부터 3(매우 공격적)까지 조절 가능, 2는 적당한 수준
    frame_duration_ms = 30
    padding_duration_ms = 300

    frames = list(frame_generator(frame_duration_ms, audio_bytes, sample_rate, sample_width))
    segments_frames = vad_collector(sample_rate, frame_duration_ms, padding_duration_ms, frames, vad)

    tasks = [
        process_segment_vad(segment_frames, i, audio)
        for i, segment_frames in enumerate(segments_frames, 1)
    ]
    results = await asyncio.gather(*tasks)
    return results

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


