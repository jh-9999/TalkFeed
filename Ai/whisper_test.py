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

# FastAPI 인스턴스
app = FastAPI(
    title="Whisper 텍스트 변환 시스템 API",
    description="Whisper API를 사용하여 음성을 텍스트로 변환하고, 텍스트 비교 기능을 제공하는 API입니다.",
    version="1.0.0",
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class NamedBytesIO(io.BytesIO):
    def __init__(self, *args, name=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.name = name

def clean_text(text: str) -> str:
    """
    1) 타임스탬프 제거
    2) 여러 공백 정리
    (문장부호는 제거하지 않음)
    """
    # 예) "[00.00s - 06.40s]" 형태 제거
    text = re.sub(r"\[\d+\.\d+s\s*-\s*\d+\.\d+s\]\s*", "", text)
    # 여러 줄바꿈, 다중 공백을 하나의 공백으로 정리
    text = " ".join(text.split())
    return text

def tokenize_with_punctuation(text: str):
    """
    단어(\w+)와 문장부호([^\w\s])를 분리하여 토큰 리스트로 반환.
    예: "안녕, 세계!" -> ["안녕", ",", "세계", "!"]
    """
    tokens = re.findall(r"\w+|[^\w\s]", text)
    return tokens

def highlight_diff_in_orig(orig_token: str, trans_token: str) -> str:
    """
    원본 토큰(orig_token)과 Whisper 토큰(trans_token)이 일부만 다를 때,
    공통 접두사/접미사는 그대로 두고, 중간의 다른 부분만 <span class="diff-delete">로 감싸 반환.
    """
    i = 0
    min_len = min(len(orig_token), len(trans_token))
    # 공통 접두사
    while i < min_len and orig_token[i] == trans_token[i]:
        i += 1

    j = 0
    # 공통 접미사
    while j < (min_len - i) and orig_token[-1 - j] == trans_token[-1 - j]:
        j += 1

    prefix = orig_token[:i]
    diff_mid = orig_token[i:len(orig_token) - j]
    suffix = orig_token[len(orig_token) - j:]

    if diff_mid:  # 중간 부분만 빨간색
        diff_mid = f'<span class="diff-delete">{diff_mid}</span>'

    return prefix + diff_mid + suffix

def create_diff_html_and_count(orig: str, trans: str) -> (str, int):
    """
    원본 텍스트(orig)와 Whisper 텍스트(trans)를 '문장부호까지 포함'하여 토큰화 후,
    difflib.SequenceMatcher를 사용해 비교.
    
    반환: (diff_html, diff_count)
      - diff_html: HTML 형태로 틀린 부분 표시
      - diff_count: 빨간색(밑줄) 처리된 '토큰' 수
    """
    # 문장부호를 포함해 토큰화
    orig_tokens = tokenize_with_punctuation(orig)
    trans_tokens = tokenize_with_punctuation(trans)

    matcher = difflib.SequenceMatcher(None, orig_tokens, trans_tokens)
    diff_parts = []
    diff_count = 0

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            # 원본 토큰 그대로 출력
            diff_parts.extend(orig_tokens[i1:i2])
        elif tag == "delete":
            # 원본에만 있는 토큰 전체 밑줄
            tokens_del = orig_tokens[i1:i2]
            diff_count += len(tokens_del)  # 삭제된 토큰 개수
            for token in tokens_del:
                diff_parts.append(f'<span class="diff-delete">{token}</span>')
        elif tag == "replace":
            # 원본 토큰 vs Whisper 토큰이 서로 다른 경우
            orig_chunk = orig_tokens[i1:i2]
            trans_chunk = trans_tokens[j1:j2]

            # 교체 구간의 토큰 수가 같다면 부분 하이라이트 시도
            if (i2 - i1) == (j2 - j1):
                for o_token, t_token in zip(orig_chunk, trans_chunk):
                    if o_token == t_token:
                        diff_parts.append(o_token)
                    else:
                        diff_count += 1
                        diff_parts.append(highlight_diff_in_orig(o_token, t_token))
            else:
                # 토큰 개수가 다르면 통째로 밑줄 처리
                diff_count += len(orig_chunk)
                for o_token in orig_chunk:
                    diff_parts.append(f'<span class="diff-delete">{o_token}</span>')
        elif tag == "insert":
            # Whisper에만 있는 토큰은 무시
            pass

    return ' '.join(diff_parts), diff_count

class CompareRequest(BaseModel):
    original_script: str
    transcription_text: str

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    MP3 파일 업로드를 받아 Whisper API로 음성을 텍스트로 변환.
    변환 후 타임스탬프, 줄바꿈, 다중 공백만 제거한 텍스트를 반환.
    """
    if file.content_type not in ["audio/mpeg", "audio/mp3"]:
        raise HTTPException(status_code=400, detail="지원되지 않는 파일 형식입니다. MP3 파일을 업로드해주세요.")
    try:
        audio_bytes = await file.read()
        logging.info(f"Received file '{file.filename}' of size: {len(audio_bytes)} bytes")
        audio_file = NamedBytesIO(audio_bytes, name=file.filename)

        # Whisper API 호출
        transcript = openai.Audio.transcribe(
            model="whisper-1",
            file=audio_file,
            response_format="verbose_json",
            temperature=0.0,
            language="ko"
        )
        logging.info("Whisper API call succeeded.")

        # 여러 segment의 text를 합쳐서 하나의 문자열로
        segments = transcript.get("segments", [])
        refined_text = " ".join([seg["text"].strip() for seg in segments])
        
        # 최소 전처리(타임스탬프 제거, 공백 정리)
        cleaned_text = clean_text(refined_text)
        return {"transcription_text": cleaned_text}
    except Exception as e:
        logging.error(f"Error in /transcribe: {str(e)}")
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"오류 발생: {str(e)}")

@app.post("/compare")
def compare_texts(request: CompareRequest):
    """
    원본 스크립트와 Whisper 변환 텍스트를 받아,
    - 틀린 부분만 하이라이트(밑줄)
    - 토큰 단위로 차이 개수를 세서 accuracy 계산
    """
    # 최소 전처리
    orig_text = clean_text(request.original_script)
    trans_text = clean_text(request.transcription_text)

    # 비교 후 diff_html, diff_count 계산
    diff_html, diff_count = create_diff_html_and_count(orig_text, trans_text)

    # 정확도 계산 (원본 토큰 수 기준)
    orig_tokens = tokenize_with_punctuation(orig_text)
    total_words = len(orig_tokens)
    if total_words > 0:
        accuracy = ((total_words - diff_count) / total_words) * 100
    else:
        accuracy = 100.0

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
