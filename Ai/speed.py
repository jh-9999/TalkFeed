import os
import tempfile
import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydub import AudioSegment
import webrtcvad

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

# 전역 스레드 풀 및 분석 결과 저장 (메모리)
thread_pool = ThreadPoolExecutor(max_workers=4)
analysis_results_memory = None

def get_speech_rate(duration: float) -> str:
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

class Frame:
    def __init__(self, bytes, timestamp, duration):
        self.bytes = bytes
        self.timestamp = timestamp
        self.duration = duration

def frame_generator(frame_duration_ms, audio_bytes, sample_rate, sample_width):
    n = int(sample_rate * (frame_duration_ms / 1000.0) * sample_width)
    offset = 0
    timestamp = 0.0
    duration = frame_duration_ms / 1000.0
    while offset + n <= len(audio_bytes):
        yield Frame(audio_bytes[offset:offset+n], timestamp, duration)
        timestamp += duration
        offset += n

def vad_collector(sample_rate, frame_duration_ms, padding_duration_ms, frames, vad):
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
        "start_time": start_time,
        "end_time": end_time,
        "duration": duration,
        "volume": volume,
        "rate": get_speech_rate(duration)
    }

async def analyze_segments_vad(audio: AudioSegment) -> list:
    audio = audio.set_channels(1)
    audio = audio.set_frame_rate(16000)
    audio = audio.set_sample_width(2)
    sample_rate = audio.frame_rate
    sample_width = audio.sample_width
    audio_bytes = audio.raw_data
    vad = webrtcvad.Vad(2)
    frame_duration_ms = 30
    padding_duration_ms = 300
    frames = list(frame_generator(frame_duration_ms, audio_bytes, sample_rate, sample_width))
    segments_frames = vad_collector(sample_rate, frame_duration_ms, padding_duration_ms, frames, vad)
    tasks = [
        process_segment_vad(segment_frames, i, audio)
        for i, segment_frames in enumerate(segments_frames, 1)
    ]
    results = await asyncio.gather(*tasks)
    results = sorted(results, key=lambda r: r["start_time"])
    merged_results = []
    i = 0
    while i < len(results):
        current = results[i]
        if current["duration"] < 1.0:
            if i < len(results) - 1:
                next_seg = results[i + 1]
                new_start = current["start_time"]
                new_end = next_seg["end_time"]
                new_duration = new_end - new_start
                total_dur = current["duration"] + next_seg["duration"]
                new_volume = (
                    current["volume"] * current["duration"] +
                    next_seg["volume"] * next_seg["duration"]
                ) / total_dur
                new_rate = get_speech_rate(new_duration)
                merged_segment = {
                    "segment": f"{current['segment']}-{next_seg['segment']}",
                    "start_time": new_start,
                    "end_time": new_end,
                    "duration": new_duration,
                    "volume": new_volume,
                    "rate": new_rate
                }
                merged_results.append(merged_segment)
                i += 2
            else:
                i += 1
        else:
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
            global analysis_results_memory
            analysis_results_memory = results  # 분석 결과를 메모리에 저장
            return {"results": results}
        except Exception as e:
            logger.error(f"Error processing audio: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            os.unlink(temp_path)
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/analysis-results")
async def get_analysis_results():
    # 분석 결과가 없으면 빈 결과 반환
    if analysis_results_memory is None:
        return {"results": []}
    return {"results": analysis_results_memory}

@app.on_event("shutdown")
async def shutdown_event():
    thread_pool.shutdown(wait=True)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

