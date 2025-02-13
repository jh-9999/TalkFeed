import os
import streamlit as st
from dotenv import load_dotenv
from openai import OpenAI

# ✅ .env 파일 로드 (API 키 불러오기)
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    raise ValueError("❌ 오류: OpenAI API 키가 설정되지 않았습니다. .env 파일을 확인하세요.")

# ✅ OpenAI 클라이언트 설정
client = OpenAI(api_key=api_key)

# ✅ Streamlit UI
st.title("🎙️ Whisper STT 변환 & 검토 시스템")

# ✅ MP3 파일 경로 입력
audio_path = st.text_input("🎵 MP3 파일 경로를 입력하세요:", "")

if "transcription_text" not in st.session_state:
    st.session_state.transcription_text = ""

if st.button("🔄 변환 시작"):
    if not os.path.exists(audio_path):
        st.error("❌ 오류: 입력한 파일이 존재하지 않습니다. 올바른 경로를 입력하세요.")
    else:
        try:
            with open(audio_path, "rb") as audio_file:
                # ✅ Whisper API 실행
                transcription = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="verbose_json",
                    timestamp_granularities=["segment"],
                    temperature=0.0,
                    language="ko"
                )

                # ✅ 자동 후처리 함수 적용
                def refine_transcription(transcription):
                    refined_segments = []
                    for segment in transcription.segments:
                        text = segment.text.strip().replace("\n", " ")
                        text = text.replace("  ", " ")  # 중복 공백 제거
                        refined_segments.append(f"[{segment.start:.2f}s - {segment.end:.2f}s] {text}")
                    return "\n".join(refined_segments)

                refined_text = refine_transcription(transcription)

                # ✅ 세션 상태에 변환된 텍스트 저장
                st.session_state.transcription_text = refined_text

        except Exception as e:
            st.error(f"❌ 오류 발생: {e}")

# ✅ 변환된 텍스트 표시
if st.session_state.transcription_text:
    st.subheader("📜 변환된 텍스트 (자동 보정 적용)")
    edited_text = st.text_area("✏️ 텍스트를 검토하고 수정하세요:", st.session_state.transcription_text, height=400)

    # ✅ 세션 상태에 저장 버튼 상태 추가
    if "save_clicked" not in st.session_state:
        st.session_state.save_clicked = False

    # ✅ 저장 버튼 클릭 상태 확인 후 저장
    if st.button("💾 저장"):
        st.session_state.save_clicked = True

    if st.session_state.save_clicked:
        save_path = "final_transcription.txt"
        with open(save_path, "w", encoding="utf-8") as f:
            f.write(edited_text)
        st.success(f"✅ 수정된 텍스트가 저장되었습니다! (파일 위치: {os.path.abspath(save_path)})")


