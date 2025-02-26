from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from vod import app as vod_app
from speed import app as speed_app
from main import app as main_app
from whisper_test import app as whisper_app
from emotion import app as emotion_app

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
    # 개발 모드에서는 reload=True를 사용하지만,
    # 프로덕션에서는 이 옵션을 제거하고 별도의 WSGI 서버(예: Gunicorn)를 사용하는 것이 좋습니다.
    import uvicorn
    uvicorn.run("end:app", host="0.0.0.0", port=8000)
