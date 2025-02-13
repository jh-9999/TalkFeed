from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
import subprocess
import cv2

app = FastAPI()

# CORS 설정 (React와 통신 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "./uploaded_videos"
EXTRACTED_FRAMES_DIR = "./extracted_images"
AUDIO_DIR = "./extracted_audio"
VIDEO_DIR = "./extracted_video"

# 폴더 생성
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(EXTRACTED_FRAMES_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)
os.makedirs(VIDEO_DIR, exist_ok=True)

# 🔹 사용자가 직접 동영상 업로드 (MP4도 자동 처리)
@app.post("/upload/")
async def upload_video(file: UploadFile = File(...)):
    try:
        file_ext = file.filename.split(".")[-1].lower()
        original_path = os.path.join(UPLOAD_DIR, file.filename)
        mp4_path = original_path if file_ext == "mp4" else os.path.join(UPLOAD_DIR, file.filename.replace(f".{file_ext}", ".mp4"))

        print(f"📂 업로드된 파일: {file.filename} (확장자: {file_ext})")

        # 🔹 같은 이름의 파일이 있으면 덮어쓰기
        if os.path.exists(original_path):
            os.remove(original_path)
        with open(original_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        print(f"✅ 파일 저장 완료: {original_path}")

        # 🔹 WebM → MP4 변환 (MP4면 그대로 진행)
        if file_ext == "webm":
            try:
                subprocess.run(
                    ["ffmpeg", "-y", "-i", original_path, "-c:v", "libx264", "-preset", "fast",
                     "-crf", "23", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", mp4_path],
                    check=True
                )
                os.remove(original_path)  # 원본 WebM 삭제
                print(f"🎥 MP4 변환 완료: {mp4_path}")

            except subprocess.CalledProcessError as e:
                print(f"❌ MP4 변환 오류: {e}")
                return {"error": "MP4 변환 실패"}

        # 🔹 MP4 파일이므로 오디오 & 비디오 분리 + 이미지 추출 수행
        audio_path, video_path = split_audio_video(mp4_path)
        extract_images(video_path, EXTRACTED_FRAMES_DIR, interval_seconds=5)

        return {
            "message": "동영상 처리 완료!",
            "mp4_file": mp4_path,
            "audio_file": audio_path,
            "video_file": video_path
        }

    except Exception as e:
        print(f"🚨 업로드 중 오류 발생: {e}")
        return {"error": str(e)}

# 🔹 오디오 & 비디오 분리 함수
def split_audio_video(mp4_path):
    base_filename = os.path.splitext(os.path.basename(mp4_path))[0]
    audio_path = os.path.join(AUDIO_DIR, f"{base_filename}.mp3")
    video_path = os.path.join(VIDEO_DIR, f"{base_filename}_video.mp4")

    try:
        # 🔹 오디오 추출
        subprocess.run(
            ["ffmpeg", "-y", "-i", mp4_path, "-q:a", "0", "-map", "a", audio_path],
            check=True
        )
        print(f"🎵 오디오 분리 완료: {audio_path}")

        # 🔹 비디오에서 오디오 제거
        subprocess.run(
            ["ffmpeg", "-y", "-i", mp4_path, "-an", video_path],
            check=True
        )
        print(f"🎬 비디오 분리 완료: {video_path}")

        return audio_path, video_path

    except subprocess.CalledProcessError as e:
        print(f"❌ 오디오/비디오 분리 오류: {e}")
        return None, None

# 🔹 5초마다 이미지 추출 함수
def extract_images(video_path, output_dir, interval_seconds=5):
    """ 5초마다 이미지를 저장하는 함수 """

    os.makedirs(output_dir, exist_ok=True)

    cap = cv2.VideoCapture(video_path)
    fps = int(cap.get(cv2.CAP_PROP_FPS))  # FPS 가져오기
    frame_interval = fps * interval_seconds  # 5초마다 저장

    frame_index = 0
    image_count = 0
    base_filename = os.path.splitext(os.path.basename(video_path))[0]

    if not cap.isOpened():
        print(f"🚨 비디오 파일을 열 수 없음: {video_path}")
        return

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        if frame_index % frame_interval == 0:
            image_filename = f"{base_filename}_frame_{image_count:04d}.jpg"
            image_path = os.path.join(output_dir, image_filename)

            # 🔹 프레임 검증: None 체크 & 크기 체크
            if frame is None or frame.size == 0:
                print(f"❌ 프레임이 비어 있음 → 저장 건너뜀: {image_path}")
                continue

            try:
                # 🔹 Windows 경로 호환성 해결 (역슬래시 → 슬래시 변경)
                image_path = os.path.abspath(   image_path).replace("\\", "/")

                success = cv2.imwrite(image_path, frame)
            except cv2.error as e:
                print(f"❌ OpenCV 저장 오류: {e}")
                success = False

            if success:
                print(f"🖼️ 이미지 저장 완료: {image_path}")
                image_count += 1
            else:
                print(f"❌ 이미지 저장 실패 (cv2.imwrite 오류): {image_path}")

        frame_index += 1

    cap.release()
    print(f"✅ 총 {image_count}개의 이미지가 저장되었습니다.")
