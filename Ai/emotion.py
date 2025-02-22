import os
import logging
import boto3
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from concurrent.futures import ThreadPoolExecutor
from typing import List, Dict
from collections import Counter, OrderedDict
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

# AWS 설정
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

# AWS Rekognition 클라이언트 설정
rekognition_client = boto3.client(
    "rekognition",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
)

# AWS Rekognition에서 제공하는 감정 목록 (순서 지정)
AWS_EMOTIONS = ["HAPPY", "SAD", "ANGRY", "CONFUSED", "DISGUSTED", "SURPRISED", "CALM", "FEAR"]

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
    AWS Rekognition을 사용해 이미지의 감정을 분석합니다.
    신뢰도 90% 이상인 감정만 반환합니다.
    """
    try:
        logger.debug("Starting analysis of one image")

        # AWS Rekognition API 호출
        response = rekognition_client.detect_faces(
            Image={"Bytes": image_bytes},
            Attributes=["ALL"]
        )

        if not response["FaceDetails"]:
            logger.warning("No face detected in the image")
            return {"results": None}

        results = []
        for face in response["FaceDetails"]:
            if "Emotions" in face:
                # 신뢰도 90% 이상 감정만 필터링
                high_confidence_emotions = [
                    {"emotion": e["Type"], "confidence": e["Confidence"]}
                    for e in face["Emotions"] if e["Confidence"] >= 90 and e["Type"] in AWS_EMOTIONS
                ]

                if high_confidence_emotions:
                    # 가장 높은 감정 찾기
                    dominant_emotion = max(high_confidence_emotions, key=lambda x: x["confidence"])
                    results.append(dominant_emotion)

        if not results:
            logger.warning("No emotions detected with confidence >= 90%")
            return {"results": None}

        logger.info(f"Analysis complete: {results}")
        return {"results": results}

    except Exception as e:
        logger.exception("Error during image analysis")
        return {"error": str(e)}

@app.post("/analyze-images")
async def analyze_images(files: List[UploadFile] = File(...)):
    """
    여러 이미지 파일을 받아 AWS Rekognition으로 감정 분석을 병렬 처리합니다.
    분석된 감정의 전체 개수를 추가로 반환합니다.
    """
    results = {}
    images_data = []  # (파일명, 이미지 바이트) 튜플 리스트
    emotion_counter = OrderedDict({emotion: 0 for emotion in AWS_EMOTIONS})
    total_images = len(files)
    no_face_count = 0

    logger.info(f"Received {total_images} file(s) for analysis")
    for file in files:
        data = await file.read()
        images_data.append((file.filename, data))
        logger.debug(f"Read file: {file.filename} (size: {len(data)} bytes)")

    # 동시 처리 스레드 수: max_workers=4
    with ThreadPoolExecutor(max_workers=4) as executor:
        future_to_filename = {
            executor.submit(analyze_single_image, data): filename
            for filename, data in images_data
        }

        for future in future_to_filename:
            filename = future_to_filename[future]
            try:
                result = future.result()
                results[filename] = result
                
                if result["results"]:
                    for emotion_data in result["results"]:
                        emotion_counter[emotion_data["emotion"]] += 1
                else:
                    no_face_count += 1
                
                logger.info(f"Analysis complete for file: {filename}")
            except Exception as e:
                logger.exception(f"Error processing file {filename}")
                results[filename] = {"error": str(e)}

    logger.info(f"Total images processed: {total_images}")
    logger.info(f"No face detected count: {no_face_count}")
    logger.info(f"Emotion count summary: {dict(emotion_counter)}")
    
    return {
        "total_images": total_images,
        "results": results,
        "emotion_counts": dict(emotion_counter),
        "no_face_count": no_face_count,
        "available_emotions": AWS_EMOTIONS
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("emotion:app", host="0.0.0.0", port=8000, reload=True)

'''AWS Rekognition 감정 종류:
HAPPY (행복)
SAD (슬픔)
ANGRY (화남)
CONFUSED (혼란)
DISGUSTED (혐오)
SURPRISED (놀람)
CALM (평온)
FEAR (두려움) '''
