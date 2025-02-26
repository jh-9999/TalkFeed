FROM python:3.12-slim

USER root

# 필요한 시스템 라이브러리 설치 (OpenCV, webrtcvad, ffmpeg 등)
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    build-essential \
    ffmpeg

WORKDIR /app
COPY requirements.txt /app/requirements.txt

# Python 의존성 설치
RUN pip install --upgrade pip && pip install -r requirements.txt

# 소스 코드 전체 복사
COPY . /app

# FastAPI 서버 실행 (Ai.end:app)
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "Ai.end:app", "--bind", "0.0.0.0:8000"]
