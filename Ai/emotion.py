import os
import logging
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from concurrent.futures import ThreadPoolExecutor
from typing import List
import numpy as np
import cv2
from deepface import DeepFace

# 로깅 설정
logging.basicConfig(
    level=logging.DEBUG,  # DEBUG 레벨 이상의 모든 로그 출력
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("emotion_image_api")

app = FastAPI()

# CORS 설정 (모든 도메인 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

def analyze_single_image(image_bytes: bytes) -> dict:
    """
    주어진 이미지 바이트 데이터를 DeepFace를 사용해 감정 분석을 수행합니다.
    각 이미지에서 검출된 얼굴에 대한 감정 결과를 개별적으로 반환합니다.
    얼굴이 검출되지 않으면 "results"에 null을 반환합니다.
    """
    try:
        logger.debug("Starting analysis of one image")
        # 이미지 디코딩 (바이트 -> numpy 배열)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None or img.size == 0:
            logger.error("Image decoding failed")
            return {"error": "이미지 디코딩 실패"}

        logger.debug("Image decoded successfully")
        # 전처리: GaussianBlur 적용 (노이즈 감소)
        processed_img = cv2.GaussianBlur(img, (3, 3), 0)
        logger.debug("GaussianBlur applied")

        # 얼굴 검출 (DeepFace.extract_faces 사용)
        face_detector = "retinaface"  # 빠른 백엔드 사용
        faces = DeepFace.extract_faces(processed_img, detector_backend=face_detector, enforce_detection=False)
        if not faces:
            logger.warning("No face detected in the image")
            # 얼굴 검출 실패 시 "results"를 null로 반환
            return {"results": None}
        logger.debug(f"Detected {len(faces)} face(s) in the image")

        # 얼굴 감정 분석 수행
        analysis = DeepFace.analyze(processed_img, actions=['emotion'], enforce_detection=False, detector_backend=face_detector)
        logger.debug(f"Raw analysis result: {analysis}")

        # 분석 결과가 리스트 형태라면 각 얼굴에 대한 결과를 개별적으로 반환
        if isinstance(analysis, list):
            results = []
            for face_analysis in analysis:
                dominant_emotion = face_analysis["dominant_emotion"]
                confidence = float(face_analysis["emotion"][dominant_emotion])
                results.append({
                    "emotion": dominant_emotion,
                    "confidence": confidence
                })
                logger.info(f"Face analysis: {dominant_emotion} (confidence: {confidence:.2f}%)")
            return {"results": results}
        else:
            dominant_emotion = analysis["dominant_emotion"]
            confidence = float(analysis["emotion"][dominant_emotion])
            logger.info(f"Face analysis (single face): {dominant_emotion} (confidence: {confidence:.2f}%)")
            return {"results": [{
                "emotion": dominant_emotion,
                "confidence": confidence
            }]}
    except Exception as e:
        logger.exception("Error during image analysis")
        return {"error": str(e)}

@app.post("/analyze-images")
async def analyze_images(files: List[UploadFile] = File(...)):
    """
    여러 이미지 파일을 받아 각 이미지에 대해 얼굴 감정 분석을 병렬 처리합니다.
    반환 결과는 각 파일 이름별로, 해당 이미지 내에서 검출된 얼굴들의 감정 결과 리스트 또는 얼굴이 없을 경우 null을 제공합니다.
    """
    results = {}
    images_data = []  # (파일명, 이미지 바이트) 튜플 리스트

    logger.info(f"Received {len(files)} file(s) for analysis")
    for file in files:
        data = await file.read()
        images_data.append((file.filename, data))
        logger.debug(f"Read file: {file.filename} (size: {len(data)} bytes)")

    # ThreadPoolExecutor를 사용해 병렬 처리 (최대 8개 스레드)
    with ThreadPoolExecutor(max_workers=8) as executor:
        future_to_filename = {}
        for filename, data in images_data:
            future = executor.submit(analyze_single_image, data)
            future_to_filename[future] = filename
            logger.debug(f"Submitted file {filename} for parallel processing")

        for future in future_to_filename:
            filename = future_to_filename[future]
            try:
                result = future.result()
                results[filename] = result
                logger.info(f"Analysis complete for file: {filename}")
            except Exception as e:
                logger.exception(f"Error processing file {filename}")
                results[filename] = {"error": str(e)}

    logger.info("All images processed")
    return {"results": results}

if __name__ == "__main__":
    import uvicorn
    # "your_module_name"을 실제 파일명(예: emotion_api)으로 변경해 주세요.
    uvicorn.run("your_module_name:app", host="0.0.0.0", port=8000, reload=True)
