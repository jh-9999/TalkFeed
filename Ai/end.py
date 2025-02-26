# 파일 경로: TalkFeed/Ai/end.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# "Ai"라는 패키지 내부의 모듈로 import
from Ai.vod import app as vod_app
from Ai.speed import app as speed_app
from Ai.main import app as main_app
from Ai.whisper_test import app as whisper_app
from Ai.emotion import app as emotion_app

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-production-domain.com"],  # 운영 환경에 맞게 수정
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 각 백엔드 앱을 마운트합니다.
app.mount("/vod", vod_app)
app.mount("/speed", speed_app)
app.mount("/ai", main_app)
app.mount("/whisper", whisper_app)
app.mount("/emotion", emotion_app)

if __name__ == "__main__":
    import uvicorn
    # "Ai.end:app"로 지정하면, 패키지명(폴더명) Ai, 모듈명 end, 인스턴스 app을 찾습니다.
    uvicorn.run("Ai.end:app", host="0.0.0.0", port=8000)
