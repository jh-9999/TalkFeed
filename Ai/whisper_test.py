import os
import re
import difflib
import io
import logging
import traceback
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import requests  # 직접 HTTP 요청용
import openai

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, ".env")
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise Exception("OpenAI API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.")
openai.api_key = api_key

app = FastAPI(
    title="Whisper 텍스트 변환 및 비교 API",
    description="Whisper API로 음성을 텍스트로 변환한 후, 미리 생성된 스크립트와 자동 비교 결과를 반환합니다.",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

whisper_results_memory = None

class NamedBytesIO(io.BytesIO):
    def __init__(self, *args, name=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.name = name

def clean_text(text: str) -> str:
    text = re.sub(r"\[\d+\.\d+s\s*-\s*\d+\.\d+s\]\s*", "", text)
    return " ".join(text.split())

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

@app.post("/update-results")
async def update_whisper_results(
    original_script: str = Form(...),
    file: UploadFile = File(...)
):
    global whisper_results_memory
    try:
        audio_bytes = await file.read()
        logger.info(f"Received file '{file.filename}' of size: {len(audio_bytes)} bytes")
        audio_file = NamedBytesIO(audio_bytes, name=file.filename)
        # Whisper API 호출을 위해 직접 HTTP 요청 사용
        headers = {
            "Authorization": f"Bearer {openai.api_key}"
        }
        files_payload = {
            "file": (audio_file.name, audio_file, "audio/mpeg")
        }
        data_payload = {
            "model": "whisper-1",
            "response_format": "verbose_json",
            "temperature": 0.0,
            "language": "ko"
        }
        response = requests.post("https://api.openai.com/v1/audio/transcriptions", headers=headers, files=files_payload, data=data_payload)
        if response.status_code != 200:
            logger.error(f"Whisper API 호출 실패: {response.text}")
            raise HTTPException(status_code=500, detail="Whisper API 호출 실패")
        transcript = response.json()
        logger.info("Whisper API 호출 성공.")
        segments = transcript.get("segments", [])
        refined_text = " ".join([seg.get("text", "").strip() for seg in segments])
        transcription_text = clean_text(refined_text)
        original_clean = clean_text(original_script)
        diff_html, diff_count = create_diff_html_and_count(original_clean, transcription_text)
        orig_tokens = tokenize_with_punctuation(original_clean)
        total_words = len(orig_tokens)
        accuracy = ((total_words - diff_count) / total_words) * 100 if total_words > 0 else 100.0

        whisper_results_memory = {
            "accuracy": accuracy,
            "diff_count": diff_count,
            "diff_html": diff_html,
            "original_clean": original_clean,
            "transcription": transcription_text
        }
        return whisper_results_memory
    except Exception as e:
        logger.error(f"오류 발생: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"오류 발생: {str(e)}")

@app.get("/analysis-results")
async def get_whisper_analysis():
    if whisper_results_memory is None:
        raise HTTPException(status_code=404, detail="분석 결과가 없습니다.")
    return whisper_results_memory

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("whisper_test:app", host="0.0.0.0", port=5000, reload=True)
