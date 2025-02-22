import os
import shutil
import subprocess
import cv2
import logging
import requests  # 반드시 설치되어 있어야 합니다.
from fastapi import FastAPI, HTTPException, File, UploadFile, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

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

# 디렉터리 설정
UPLOAD_DIR = "./uploads"
EXTRACTED_FRAMES_DIR = "./extracted_images"
AUDIO_DIR = "./extracted_audio"
VIDEO_DIR = "./extracted_video"

for d in [UPLOAD_DIR, EXTRACTED_FRAMES_DIR, AUDIO_DIR, VIDEO_DIR]:
    os.makedirs(d, exist_ok=True)

def clear_previous_files():
    directories = [UPLOAD_DIR, EXTRACTED_FRAMES_DIR, AUDIO_DIR, VIDEO_DIR]
    for directory in directories:
        for filename in os.listdir(directory):
            file_path = os.path.join(directory, filename)
            try:
                if os.path.isfile(file_path) or os.path.islink(file_path):
                    os.remove(file_path)
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)
            except Exception as e:
                logger.error(f"Error removing file {file_path}: {e}")

def split_audio_video(mp4_path):
    base_filename = os.path.splitext(os.path.basename(mp4_path))[0]
    audio_path = os.path.join(AUDIO_DIR, f"{base_filename}.mp3")
    video_path = os.path.join(VIDEO_DIR, f"{base_filename}_video.mp4")
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-i", mp4_path, "-q:a", "0", "-map", "a", audio_path],
            check=True
        )
        logger.info(f"Audio separated: {audio_path}")
        subprocess.run(
            ["ffmpeg", "-y", "-i", mp4_path, "-an", video_path],
            check=True
        )
        logger.info(f"Video separated: {video_path}")
        return audio_path, video_path
    except subprocess.CalledProcessError as e:
        logger.error(f"Error separating audio/video: {e}")
        return None, None

def extract_images(video_path, output_dir, interval_seconds=5):
    os.makedirs(output_dir, exist_ok=True)
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        logger.error(f"Error opening video: {video_path}")
        return
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    frame_interval = fps * interval_seconds
    frame_index = 0
    image_count = 0
    base_filename = os.path.splitext(os.path.basename(video_path))[0]
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        if frame_index % frame_interval == 0:
            image_filename = f"{base_filename}_frame_{image_count:04d}.jpg"
            image_path = os.path.join(output_dir, image_filename)
            try:
                cv2.imwrite(image_path, frame)
                logger.info(f"Image saved: {image_path}")
                image_count += 1
            except Exception as e:
                logger.error(f"Error saving image: {image_path}, {e}")
        frame_index += 1
    cap.release()
    logger.info(f"Total images saved: {image_count}")

@app.get("/audio/{filename}")
def get_audio(filename: str):
    audio_path = os.path.join(AUDIO_DIR, filename)
    if os.path.exists(audio_path):
        return FileResponse(audio_path, media_type="audio/mpeg")
    raise HTTPException(status_code=404, detail="Audio file not found")

@app.get("/")
def read_root():
    return {"message": "vod.py is running"}

# 백그라운드 작업: speed.py의 /upload-audio 엔드포인트로 오디오 파일 전송
def trigger_speed_analysis(audio_path: str):
    speed_url = "http://localhost:8000/speed/upload-audio"
    logger.info("Sending audio file to speed analysis endpoint (background)...")
    with open(audio_path, "rb") as audio_file:
        files = {"audio": (os.path.basename(audio_path), audio_file, "audio/mpeg")}
        try:
            # 타임아웃을 60초로 설정
            speed_response = requests.post(speed_url, files=files, timeout=60)
            if speed_response.status_code != 200:
                logger.error(f"Speed analysis failed: {speed_response.text}")
            else:
                logger.info(f"Speed analysis triggered successfully: {speed_response.json()}")
        except Exception as e:
            logger.error(f"Error triggering speed analysis in background: {e}")

@app.post("/upload/")
async def upload_video(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    try:
        clear_previous_files()
        
        file_ext = file.filename.split(".")[-1].lower()
        original_path = os.path.join(UPLOAD_DIR, file.filename)
        if file_ext == "mp4":
            mp4_path = original_path
        else:
            mp4_path = os.path.join(UPLOAD_DIR, file.filename.replace(f".{file_ext}", ".mp4"))
        
        with open(original_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        logger.info(f"File saved: {original_path}")
        
        # webm -> mp4 변환 (필요한 경우)
        if file_ext == "webm":
            try:
                subprocess.run(
                    [
                        "ffmpeg", "-y", "-i", original_path,
                        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
                        "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart",
                        mp4_path
                    ],
                    check=True
                )
                os.remove(original_path)
                logger.info(f"Converted to mp4: {mp4_path}")
            except subprocess.CalledProcessError as e:
                logger.error(f"Error converting to mp4: {e}")
                raise HTTPException(status_code=500, detail="MP4 conversion failed")
        
        # 오디오/비디오 분리
        audio_path, video_path = split_audio_video(mp4_path)
        if audio_path is None or video_path is None:
            raise HTTPException(status_code=500, detail="Audio/Video splitting failed")
        
        extract_images(video_path, EXTRACTED_FRAMES_DIR, interval_seconds=5)
        
        # 백그라운드 작업으로 speed.py 분석 요청 트리거
        if background_tasks is not None:
            background_tasks.add_task(trigger_speed_analysis, audio_path)
        else:
            trigger_speed_analysis(audio_path)
        
        return {
            "message": "Video processed successfully",
            "mp4_file": mp4_path,
            "audio_file": audio_path,
            "video_file": video_path
        }
        
    except Exception as e:
        logger.error(f"Error in upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
