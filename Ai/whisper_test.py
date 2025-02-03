import os
import whisper

# FFmpeg 경로 설정 (FFmpeg이 설치된 경로 추가)
os.environ["PATH"] += os.pathsep + r"C:\Users\zordi\Desktop\ffmpeg-2025-01-20-git-504df09c34-essentials_build\bin"

# 📥 Whisper 모델 로드 (한 번만 로드하여 속도 최적화)
print("📥 Whisper 모델 로드 중... (처음 한 번만 로드)")
model = whisper.load_model("base")  # "tiny", "base", "small" 선택 가능

def transcribe_audio(audio_path):
    """
    주어진 오디오 파일을 STT로 변환하는 함수
    - 모델을 매번 로드하지 않고 재사용
    """
    print(f"🎙️ {audio_path} 음성을 텍스트로 변환 중...")

    result = model.transcribe(
        audio_path,
        language="ko",  # 한국어 지정
        temperature=0,  # 더 정확한 결과를 위해
        fp16=False,  # CPU 환경 최적화 (True 사용 시 GPU 가속)
        verbose=True,  # 터미널에 변환 진행 상황 표시
    )

    # 📌 타임스탬프 + 문장 정리
    formatted_text = ""
    for segment in result["segments"]:
        start_time = segment["start"]
        end_time = segment["end"]
        text = segment["text"]
        formatted_text += f"[{start_time:.2f} ~ {end_time:.2f}] {text}\n\n"

    # 📝 변환된 텍스트 저장
    output_file = f"{audio_path}.txt"
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(formatted_text)

    print(f"✅ 변환 완료! 결과 저장: {output_file}")

# ✅ 여러 개의 파일을 변환할 경우
audio_files = ["downloads/sample.mp3"]  # 필요하면 파일 리스트 추가 가능
for audio in audio_files:
    transcribe_audio(audio)  # ✅ 모델을 다시 로드하지 않고 바로 변환!
