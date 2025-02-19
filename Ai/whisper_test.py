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

def highlight_diff_in_orig(orig_token: str, trans_token: str) -> str:
    """
    원본 토큰(orig_token)과 Whisper 토큰(trans_token)이 일부만 다를 때,
    공통 접두사/접미사는 그대로 두고, 중간의 다른 부분만 <span class="diff-delete">로 감싸 반환.

    예) 원본: "국영수", Whisper: "구경수"
         - 공통 접미사: "수"
         - 중간 차이: "국영" vs "구경"
         => 원본 기준 "국영"만 밑줄 표시, "수"는 그대로
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

    prefix = orig_token[:i]               # 공통 접두사
    diff_mid = orig_token[i:len(orig_token) - j]  # 중간에 다른 부분
    suffix = orig_token[len(orig_token) - j:]      # 공통 접미사

    if diff_mid:  # 중간 부분만 빨간색
        diff_mid = f'<span class="diff-delete">{diff_mid}</span>'

    return prefix + diff_mid + suffix

def create_diff_html_and_count(orig: str, trans: str) -> (str, int):
    """
    원본 텍스트(orig)와 Whisper 텍스트(trans)를 토큰 단위로 비교하여,
    1) 원본 토큰 전체를 순서대로 출력
    2) 'delete' -> 원본에만 있는 토큰: 전체 빨간 밑줄
    3) 'replace' -> 일부만 다른 경우 부분만 빨간 밑줄
    4) 'insert' -> Whisper에만 있는 토큰은 무시
    5) 'equal'  -> 그대로 출력

    반환: (diff_html, diff_count)
      - diff_html: 실제 HTML
      - diff_count: 빨간색(밑줄) 처리된 '토큰' 수
        (단, 부분만 다른 경우에도 토큰 1개로 계산)
    """
    orig_tokens = orig.split()
    trans_tokens = trans.split()

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
            # 원본 토큰 개수 == Whisper 토큰 개수일 때만 부분 하이라이트
            orig_chunk = orig_tokens[i1:i2]
            trans_chunk = trans_tokens[j1:j2]
            if (i2 - i1) == (j2 - j1):
                # 1:1 대응 → 부분만 다른 경우 highlight
                for o_token, t_token in zip(orig_chunk, trans_chunk):
                    if o_token == t_token:
                        diff_parts.append(o_token)
                    else:
                        diff_count += 1  # 이 토큰이 교체되었다고 판단
                        # 부분만 다른 부분만 빨간색
                        diff_parts.append(highlight_diff_in_orig(o_token, t_token))
            else:
                # 토큰 개수가 안 맞으면 전체 밑줄
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

app = FastAPI()

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    MP3 파일 업로드를 받아 Whisper API로 음성을 텍스트로 변환.
    변환 후 타임스탬프, 줄바꿈, 다중 공백, 특수기호를 제거한 클린 텍스트를 반환.
    """
    if file.content_type not in ["audio/mpeg", "audio/mp3"]:
        raise HTTPException(status_code=400, detail="지원되지 않는 파일 형식입니다. MP3 파일을 업로드해주세요.")
    try:
        audio_bytes = await file.read()
        logging.info(f"Received file '{file.filename}' of size: {len(audio_bytes)} bytes")

        audio_file = NamedBytesIO(audio_bytes, name=file.filename)

        transcript = openai.Audio.transcribe(
            model="whisper-1",
            file=audio_file,
            response_format="verbose_json",
            temperature=0.0,
            language="ko"
        )
        logging.info("Whisper API call succeeded.")

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
    원본 스크립트와 Whisper 변환 텍스트를 받아,
    - 원본을 전체 출력
    - 틀린 부분만 부분 하이라이트(밑줄)
    - 토큰 단위로 차이 개수를 세서 accuracy 계산
    """
    orig_text = clean_text(request.original_script)
    trans_text = clean_text(request.transcription_text)

    # 부분 차이도 밑줄 처리 & diff_count 계산
    diff_html, diff_count = create_diff_html_and_count(orig_text, trans_text)

    # 정확도 계산 (원본 토큰 수 기준)
    orig_tokens = orig_text.split()
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
