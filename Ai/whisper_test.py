import os
import re
import difflib
import io
import logging
import traceback
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import openai

# 로깅 설정 (INFO 레벨)
logging.basicConfig(level=logging.INFO)

# 현재 파일 위치 기준 .env 경로 설정
current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, ".env")
load_dotenv(dotenv_path=env_path)

# 환경 변수에서 API 키 로드 및 설정
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise Exception("OpenAI API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.")
openai.api_key = api_key

app = FastAPI(
    title="Whisper 텍스트 변환 시스템 API",
    description="Whisper API를 사용하여 음성을 텍스트로 변환하고, 텍스트 비교 기능을 제공하는 API입니다.",
    version="1.0.0",
)

# CORS 설정 (모든 출처 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# NamedBytesIO 클래스 정의: BytesIO 객체에 'name' 속성 추가
class NamedBytesIO(io.BytesIO):
    def __init__(self, *args, name=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.name = name

def clean_text(text: str) -> str:
    """
    타임스탬프, 줄바꿈, 다중 공백, 그리고 특수기호(느낌표, 물음표 등)를 제거하여 클린 텍스트로 반환.
    예: "[00.00s - 06.40s] 자, 얘들아!" → "자 얘들아"
    """
    # 타임스탬프 제거
    text = re.sub(r"\[\d+\.\d+s\s*-\s*\d+\.\d+s\]\s*", "", text)
    # 줄바꿈 및 다중 공백 정리
    text = " ".join(text.replace("\n", " ").split())
    # 특수기호 제거 (알파벳, 숫자, 밑줄, 공백을 제외한 모든 문자)
    text = re.sub(r"[^\w\s]", "", text)
    return text

def create_original_diff_html(orig: str, trans: str) -> str:
    """
    원본 텍스트(orig)와 Whisper 텍스트(trans)를 토큰 단위로 비교하여,
    최종적으로 원본 텍스트를 그대로 출력하되, Whisper와 다른 부분(원본에만 있거나 대체된 부분)은
    <span class="diff-delete">로 강조하여 표시합니다.
    
    - equal: 원본 토큰 그대로 출력
    - replace, delete: 원본 토큰을 빨간색으로 강조
    - insert: Whisper에만 있는 토큰은 무시
    """
    orig_tokens = orig.split()
    trans_tokens = trans.split()
    matcher = difflib.SequenceMatcher(None, orig_tokens, trans_tokens)
    parts = []
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            parts.extend(orig_tokens[i1:i2])
        elif tag in ("replace", "delete"):
            # 원본에 존재하는 토큰을 강조하여 출력
            for token in orig_tokens[i1:i2]:
                parts.append(f'<span class="diff-delete">{token}</span>')
        elif tag == "insert":
            # Whisper에만 있는 토큰은 출력하지 않음
            continue
    return ' '.join(parts)

class CompareRequest(BaseModel):
    original_script: str
    transcription_text: str

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    MP3 파일 업로드를 받아 Whisper API로 음성을 텍스트로 변환.
    변환 후 타임스탬프, 줄바꿈, 다중 공백, 특수기호를 제거한 클린 텍스트를 반환.
    """
    if file.content_type not in ["audio/mpeg", "audio/mp3"]:
        raise HTTPException(status_code=400, detail="지원되지 않는 파일 형식입니다. MP3 파일을 업로드해주세요.")
    try:
        # 파일 내용을 BytesIO 객체로 읽음
        audio_bytes = await file.read()
        logging.info(f"Received file '{file.filename}' of size: {len(audio_bytes)} bytes")
        
        # NamedBytesIO를 사용하여 파일명 설정
        audio_file = NamedBytesIO(audio_bytes, name=file.filename)
        
        # openai.Audio.transcribe 함수 호출 (최신 인터페이스)
        transcript = openai.Audio.transcribe(
            model="whisper-1",
            file=audio_file,
            response_format="verbose_json",
            temperature=0.0,
            language="ko"
        )
        logging.info("Whisper API call succeeded.")
        
        # transcript["segments"]에서 텍스트 추출
        segments = transcript.get("segments", [])
        refined_text = " ".join([seg["text"].strip() for seg in segments])
        cleaned_text = clean_text(refined_text)
        return {"transcription_text": cleaned_text}
    except Exception as e:
        logging.error(f"Error in /transcribe: {str(e)}")
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"오류 발생: {str(e)}")

@app.post("/compare")
def compare_texts(request: CompareRequest):
    """
    원본 스크립트와 Whisper 변환 텍스트를 받아 전처리 후,
    단어 단위 차이 개수, 정확도, 그리고 원본 텍스트를 기반으로 한 diff HTML 결과를 반환.
    결과 HTML은 사용자가 입력한 원본 텍스트만 출력하며,
    Whisper와 달라진 부분은 빨간색으로 강조됩니다.
    """
    orig_text = clean_text(request.original_script)
    trans_text = clean_text(request.transcription_text)
    
    orig_tokens = orig_text.split()
    trans_tokens = trans_text.split()
    ndiff = list(difflib.ndiff(orig_tokens, trans_tokens))
    diff_count = sum(1 for d in ndiff if d.startswith('+ ') or d.startswith('- '))
    total_words = max(len(orig_tokens), len(trans_tokens))
    accuracy = ((total_words - diff_count) / total_words) * 100 if total_words > 0 else 100
    
    diff_html = create_original_diff_html(orig_text, trans_text)
    
    return {
        "accuracy": accuracy,
        "diff_count": diff_count,
        "diff_html": diff_html,
        "original_clean": orig_text,
        "transcription": trans_text
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("whisper:app", host="0.0.0.0", port=8000, reload=True)
