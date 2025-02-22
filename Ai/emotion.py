import os
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import numpy as np
import cv2
from deepface import DeepFace
import tensorflow as tf
import time
import traceback
import openai
import asyncio

# OpenAI API 키 및 모델 이름 설정
openai.api_key = os.getenv("OPENAI_API_KEY")
MODEL_NAME = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")  # 기본값은 gpt-3.5-turbo

# LLM 캐시: (emotion, confidence) -> explanation
llm_cache = {}

# 로깅 설정
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(message)s - %(pathname)s:%(lineno)d",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("emotion_image_api")

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def initialize_deepface():
    """DeepFace 초기화 및 테스트"""
    try:
        logger.info("DeepFace 초기화 시작")
        test_img = np.zeros((100, 100, 3), dtype=np.uint8)
        DeepFace.analyze(
            test_img,
            actions=['emotion'],
            enforce_detection=False,
            detector_backend="retinaface"
        )
        logger.info("DeepFace 초기화 성공")
        return True
    except Exception as e:
        logger.error(f"DeepFace 초기화 실패: {str(e)}")
        logger.error(traceback.format_exc())
        return False

# 시작 시 DeepFace 초기화
if not initialize_deepface():
    logger.error("DeepFace 초기화 실패로 서버 시작이 중단됩니다.")
    raise SystemExit(1)

def preprocess_image(img: np.ndarray) -> np.ndarray:
    """이미지 전처리"""
    try:
        if img.shape[0] > 640 or img.shape[1] > 640:
            scale = 640 / max(img.shape[0], img.shape[1])
            img = cv2.resize(img, None, fx=scale, fy=scale)
        img = cv2.GaussianBlur(img, (3, 3), 0)
        return img
    except Exception as e:
        logger.error(f"이미지 전처리 오류: {str(e)}")
        raise

async def query_llm(emotion: str, confidence: float) -> str:
    """
    LLM(GPT-3.5-turbo)을 호출하여 감정 분석 결과에 대한 간단한 설명(한 문장)을 받아옵니다.
    캐싱을 사용하여 동일 요청에 대한 반복 호출을 방지하고, max_tokens로 응답 길이를 제한합니다.
    """
    key = f"{emotion}:{confidence:.2f}"
    if key in llm_cache:
        return llm_cache[key]
    
    prompt = (
        f"Detected emotion: {emotion} with confidence: {confidence:.2f}%. "
        "Provide a brief explanation in one sentence of what this emotion might indicate in facial expression analysis."
    )
    try:
        response = await openai.ChatCompletion.acreate(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": "You are an expert in human emotions and psychology."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=50  # 응답 길이 제한
        )
        explanation = response["choices"][0]["message"]["content"]
        llm_cache[key] = explanation
        return explanation
    except Exception as e:
        logger.error(f"LLM 호출 실패: {str(e)}")
        return "LLM 호출에 실패했습니다."

async def process_image(file: UploadFile) -> Dict[str, Any]:
    """단일 이미지 처리 및 LLM 설명 병렬 호출 적용"""
    try:
        logger.debug(f"이미지 처리 시작: {file.filename}")
        contents = await file.read()
        if not contents:
            return {"status": "error", "error": "빈 파일"}
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return {"status": "error", "error": "이미지 디코딩 실패"}
        img = preprocess_image(img)
        logger.debug(f"이미지 전처리 완료: {file.filename}")
        
        result = DeepFace.analyze(
            img,
            actions=['emotion'],
            enforce_detection=False,
            detector_backend="retinaface"
        )
        logger.debug(f"DeepFace 분석 완료: {file.filename}")
        
        # 여러 얼굴이 인식된 경우 병렬로 LLM 호출
        if isinstance(result, list):
            tasks = []
            valid_faces = []
            for face in result:
                if face and "dominant_emotion" in face:
                    emotion = face["dominant_emotion"]
                    confidence = face.get("emotion", {}).get(emotion, 0)
                    valid_faces.append((emotion, confidence))
                    tasks.append(query_llm(emotion, confidence))
            explanations = await asyncio.gather(*tasks) if tasks else []
            faces = []
            for (emotion, confidence), explanation in zip(valid_faces, explanations):
                faces.append({
                    "emotion": emotion,
                    "confidence": float(confidence),
                    "explanation": explanation
                })
            return {"status": "success", "faces": faces if faces else None}
        else:
            if "dominant_emotion" not in result:
                return {"status": "error", "error": "감정 분석 실패"}
            emotion = result["dominant_emotion"]
            confidence = result.get("emotion", {}).get(emotion, 0)
            explanation = await query_llm(emotion, confidence)
            return {"status": "success", "faces": [{
                "emotion": emotion,
                "confidence": float(confidence),
                "explanation": explanation
            }]}
    except Exception as e:
        logger.error(f"이미지 처리 오류 ({file.filename}): {str(e)}")
        logger.error(traceback.format_exc())
        return {"status": "error", "error": str(e)}

@app.post("/analyze-images")
async def analyze_images(files: List[UploadFile] = File(...)):
    """이미지 분석 엔드포인트 - 파일별 처리도 병렬로 진행"""
    try:
        logger.info(f"요청 받음: {len(files)}개 파일")
        if not files:
            raise HTTPException(status_code=400, detail="파일이 제공되지 않았습니다.")
        results = {}
        start_time = time.time()
        tasks = []
        filenames = []
        for file in files:
            filenames.append(file.filename)
            tasks.append(process_image(file))
        responses = await asyncio.gather(*tasks)
        for filename, res in zip(filenames, responses):
            results[filename] = res
        processing_time = time.time() - start_time
        logger.info(f"전체 처리 완료. 소요 시간: {processing_time:.2f}초")
        return {
            "status": "success",
            "processing_time": processing_time,
            "results": results
        }
    except Exception as e:
        logger.error("전체 처리 중 오류 발생")
        logger.error(traceback.format_exc())
        return {
            "status": "error",
            "error": str(e),
            "processing_time": 0,
            "results": {}
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "emotion:app",
        host="0.0.0.0",
        port=8000,
        workers=1,
        reload=True
    )