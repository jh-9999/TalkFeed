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
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("emotion_image_api")

app = FastAPI()

# CORS 설정
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
    얼굴이 검출되지 않거나, 신뢰도가 85% 미만이면 "results"에 null을 반환합니다.
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

        # 얼굴 검출
        face_detector = "retinaface"
        faces = DeepFace.extract_faces(processed_img, detector_backend=face_detector, enforce_detection=False)
        if not faces:
            logger.warning("No face detected in the image")
            return {"results": None}
        logger.debug(f"Detected {len(faces)} face(s) in the image")

        # 얼굴 감정 분석 수행
        analysis = DeepFace.analyze(
            processed_img,
            actions=['emotion'],
            enforce_detection=False,
            detector_backend=face_detector
        )
        logger.debug(f"Raw analysis result: {analysis}")

        # 신뢰도 기준 (85%)
        THRESHOLD = 85.0

        # 다중 얼굴 분석
        if isinstance(analysis, list):
            results = []
            for face_analysis in analysis:
                dominant_emotion = face_analysis["dominant_emotion"]
                confidence = float(face_analysis["emotion"][dominant_emotion])
                if confidence < THRESHOLD:
                    logger.info(f"Face confidence {confidence:.2f}% < {THRESHOLD}%; skipping face.")
                    continue
                results.append({
                    "emotion": dominant_emotion,
                    "confidence": confidence
                })
            if not results:
                logger.warning("No face meets the confidence threshold.")
                return {"results": None}
            return {"results": results}

        # 단일 얼굴 분석
        else:
            dominant_emotion = analysis["dominant_emotion"]
            confidence = float(analysis["emotion"][dominant_emotion])
            if confidence < THRESHOLD:
                logger.info(f"Face confidence {confidence:.2f}% < {THRESHOLD}%; returning null.")
                return {"results": None}
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
    동시 처리는 최대 4개 스레드로 제한.
    """
    results = {}
    images_data = []  # (파일명, 이미지 바이트) 튜플 리스트

    logger.info(f"Received {len(files)} file(s) for analysis")
    for file in files:
        data = await file.read()
        images_data.append((file.filename, data))
        logger.debug(f"Read file: {file.filename} (size: {len(data)} bytes)")

    # 동시 처리 스레드 수: max_workers=4
    with ThreadPoolExecutor(max_workers=4) as executor:
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
    uvicorn.run("emotion:app", host="0.0.0.0", port=8000, reload=True)