# end.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from vod import app as vod_app
from speed import app as speed_app

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 서브 앱 마운트: vod.py의 엔드포인트는 /vod 하위에서, speed.py의 엔드포인트는 /speed 하위에서 접근
app.mount("/vod", vod_app)
app.mount("/speed", speed_app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("end:app", host="0.0.0.0", port=8000, reload=True)
