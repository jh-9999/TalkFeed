import os
import logging
import boto3
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from collections import OrderedDict
from dotenv import load_dotenv
import re
import difflib
import io

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

app = FastAPI(
    title="Emotion Analysis API",
    description="이미지에서 얼굴 감정을 분석합니다.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 전역 변수: vod.py에서 전달받은 최신 emotion 분석 결과 저장
emotion_results_memory = None

# POST /update-results: vod.py에서 분석 결과를 업데이트할 때 호출
@app.post("/update-results")
async def update_emotion_results(result: dict):
    global emotion_results_memory
    emotion_results_memory = result
    logger.info("Emotion results updated successfully.")
    return {"message": "Emotion results updated successfully."}

# GET /analysis-results: 프론트엔드에서 최신 emotion 분석 결과를 가져갈 때 사용
@app.get("/analysis-results")
async def get_emotion_analysis():
    if emotion_results_memory is None:
        raise HTTPException(status_code=404, detail="Emotion analysis results are not available.")
    return emotion_results_memory

# --- 이하 analyze_images 및 analyze_single_image 함수는 기존과 동일합니다 ---

def tokenize_with_punctuation(text: str):
    tokens = re.findall(r"\w+|[^\w\s]", text)
    return tokens

def highlight_diff_in_orig(orig_token: str, trans_token: str) -> str:
    i = 0
    min_len = min(len(orig_token), len(trans_token))
    while i < min_len and orig_token[i] == trans_token[i]:
        i += 1
    j = 0
    while j < (min_len - i) and orig_token[-1 - j] == trans_token[-1 - j]:
        j += 1
    prefix = orig_token[:i]
    if j > 0:
        diff_mid = orig_token[i:len(orig_token) - j]
        suffix = orig_token[len(orig_token) - j:]
    else:
        diff_mid = orig_token[i:]
        suffix = ""
    if diff_mid:
        diff_mid = f'<span class="diff-delete">{diff_mid}</span>'
    return prefix + diff_mid + suffix

def create_diff_html_and_count(orig: str, trans: str) -> (str, int):
    orig_tokens = tokenize_with_punctuation(orig)
    trans_tokens = tokenize_with_punctuation(trans)
    matcher = difflib.SequenceMatcher(None, orig_tokens, trans_tokens)
    diff_parts = []
    diff_count = 0
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            diff_parts.extend(orig_tokens[i1:i2])
        elif tag == "delete":
            tokens_del = orig_tokens[i1:i2]
            diff_count += len(tokens_del)
            for token in tokens_del:
                diff_parts.append(f'<span class="diff-delete">{token}</span>')
        elif tag == "replace":
            orig_chunk = orig_tokens[i1:i2]
            trans_chunk = trans_tokens[j1:j2]
            if (i2 - i1) == (j2 - j1):
                for o_token, t_token in zip(orig_chunk, trans_chunk):
                    if o_token == t_token:
                        diff_parts.append(o_token)
                    else:
                        diff_count += 1
                        diff_parts.append(highlight_diff_in_orig(o_token, t_token))
            else:
                diff_count += len(orig_chunk)
                for o_token in orig_chunk:
                    diff_parts.append(f'<span class="diff-delete">{o_token}</span>')
        elif tag == "insert":
            pass
    return ' '.join(diff_parts), diff_count

def analyze_single_image(image_bytes: bytes) -> dict:
    try:
        logger.debug("Starting analysis of one image")
        response = rekognition_client.detect_faces(
            Image={"Bytes": image_bytes},
            Attributes=["ALL"]
        )
        if not response["FaceDetails"]:
            logger.warning("No face detected in the image")
            return {"results": []}
        results = []
        for face in response["FaceDetails"]:
            if "Emotions" in face:
                high_confidence_emotions = [
                    {"emotion": e["Type"], "confidence": e["Confidence"]}
                    for e in face["Emotions"]
                    if e["Confidence"] >= 90 and e["Type"] in AWS_EMOTIONS
                ]
                if high_confidence_emotions:
                    dominant_emotion = max(high_confidence_emotions, key=lambda x: x["confidence"])
                    results.append(dominant_emotion)
        if not results:
            logger.warning("No emotions detected with confidence >= 90%")
            return {"results": []}
        logger.info(f"Analysis complete: {results}")
        return {"results": results}
    except Exception as e:
        logger.exception("Error during image analysis")
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("emotion:app", host="0.0.0.0", port=8000, reload=True)
