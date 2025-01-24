from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydub import AudioSegment
from pydub.silence import split_on_silence
import os

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React 개발 서버 주소
    allow_credentials=True,
    allow_methods=["*"],  # 모든 HTTP 메서드 허용
    allow_headers=["*"],  # 모든 헤더 허용
)

@app.post("/upload-audio")
async def process_audio(audio: UploadFile = File(...)):
    try:
        # 임시 파일 저장
        with open(f"temp_{audio.filename}", "wb") as buffer:
            buffer.write(await audio.read())
        
        # 오디오 분석
        results = analyze_segments(f"temp_{audio.filename}")
        
        # 임시 파일 삭제
        os.remove(f"temp_{audio.filename}")
        
        return {"results": results}
    except Exception as e:
        return {"error": str(e)}

def analyze_segments(audio_path):
    try:
        audio = AudioSegment.from_file(audio_path)
        segments = split_on_silence(
            audio,
            min_silence_len=1000,
            silence_thresh=-40,
            keep_silence=200
        )
        
        results = []
        for i, segment in enumerate(segments, 1):
            duration = len(segment) / 1000
            volume = segment.dBFS
            
            rate = "보통"
            if duration < 1.5:
                rate = "빠름"
            elif duration > 3:
                rate = "느림"
            
            results.append({
                "segment": i,
                "duration": duration,
                "volume": volume,
                "rate": rate
            })
            
        return results
            
    except Exception as e:
        raise Exception(f"분석 중 오류 발생: {e}")