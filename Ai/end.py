from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from vod import app as vod_app
from speed import app as speed_app
from main import app as main_app
from whisper_test import app as whisper_app

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 각 백엔드 앱을 마운트합니다.
app.mount("/vod", vod_app)
app.mount("/speed", speed_app)
app.mount("/ai", main_app)
app.mount("/whisper", whisper_app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("end:app", host="0.0.0.0", port=8000, reload=True)
