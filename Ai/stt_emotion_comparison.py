from deepface import DeepFace
import cv2
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np
from scipy.ndimage import gaussian_filter1d

# font_path = "C:/Windows/Fonts/malgun.ttf"
# font_prop = fm.FontProperties(fname=font_path, size=12)
# plt.rcParams['font.family'] = font_prop.get_name()

### 1️⃣ 감정 분석 (DeepFace)
def analyze_video_with_feedback(video_path, output_file="feedback.txt"):
    try:
        cap = cv2.VideoCapture(video_path)

        if not cap.isOpened():
            print(f"Error: Unable to open video file at {video_path}")
            return

        fps = int(cap.get(cv2.CAP_PROP_FPS))
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count / fps
        print(f"📽️ Video loaded: {video_path}")
        print(f"⏳ Duration: {duration:.2f}s, FPS: {fps}, Total Frames: {frame_count}")

        results = []
        frame_index = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if frame_index % (fps * 10) == 0:
                try:
                    print(f"🎭 Analyzing frame at {frame_index}, Time: {frame_index / fps:.2f}s")
                    analysis = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=False)

                    if isinstance(analysis, list) and analysis:
                        dominant_emotion = analysis[0].get('dominant_emotion', 'Unknown')
                    elif isinstance(analysis, dict):
                        dominant_emotion = analysis.get('dominant_emotion', 'Unknown')
                    else:
                        dominant_emotion = 'Unknown'

                    timestamp = frame_index / fps
                    if dominant_emotion != 'Unknown':
                        results.append((timestamp, timestamp + 10, dominant_emotion))
                        print(f"✔ {timestamp:.2f}s - {dominant_emotion}")

                except Exception as e:
                    print(f"❌ Error analyzing frame at {frame_index}: {e}")

            frame_index += fps * 10
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_index)

        cap.release()

        if results:
            with open(output_file, "w") as f:
                for start_time, end_time, emotion in results:
                    f.write(f"{start_time:.2f}-{end_time:.2f}s: {emotion}\n")
            print(f"📄 감정 분석 결과 저장: {output_file}")
        else:
            print("⚠ No emotions detected.")

    except Exception as e:
        print(f"🚨 Error: {e}")

### 2️⃣ STT 분석 (Whisper)
def load_stt_results(file_path="downloads/sample.mp3.txt"):
    stt_data = []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f.readlines():
                parts = line.strip().split("] ")
                if len(parts) == 2:
                    time_info = parts[0][1:]
                    text = parts[1]

                    start_time = float(time_info.split(" ~ ")[0])
                    stt_data.append((start_time, text))
        return stt_data
    except Exception as e:
        print(f"❌ STT 파일 오류: {e}")
        return []

### 3️⃣ 감정 분석 데이터 로드
def load_emotion_results(file_path="feedback.txt"):
    emotion_data = []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f.readlines():
                parts = line.strip().split(": ")
                if len(parts) != 2:
                    continue

                time_range, emotion = parts
                try:
                    start_time, end_time = time_range.replace("s", "").split("-")
                    start_time, end_time = float(start_time), float(end_time)
                    emotion_data.append((start_time, end_time, emotion))
                except ValueError:
                    continue

        return emotion_data
    except Exception as e:
        print(f"❌ 감정 분석 파일 오류: {e}")
        return []



### 4️⃣ **모든 구간을 출력하고, 감정과 대사가 일치하는지 확인**
def compare_emotion_and_speech(stt_data, emotion_data):
    results = []
    
    for stt_time, stt_text in stt_data:
        closest_emotion = None
        for emotion_start, emotion_end, emotion in emotion_data:
            if emotion_start <= stt_time <= emotion_end:
                closest_emotion = emotion
                break

        if closest_emotion:
            # 감정과 대사의 의미 분석 (긍정/부정 감정 비교)
            speech_sentiment = "positive" if any(word in stt_text for word in ["기쁘다", "좋다", "행복"]) else "negative"
            emotion_sentiment = "positive" if closest_emotion in ["happy", "surprise"] else "negative"
            
            match_status = "✅ 일치" if speech_sentiment == emotion_sentiment else "❌ 불일치"
            results.append((stt_time, stt_text, closest_emotion, match_status))

    return results

def visualize_emotion_speech_comparison(comparison_results):
    timestamps = [result[0] for result in comparison_results]
    emotions = [result[2] for result in comparison_results]
    texts = [result[1] for result in comparison_results]
    match_status = [result[3] for result in comparison_results]

    emotion_mapping = {"happy": 3, "surprise": 2, "neutral": 1, "sad": -1, "angry": -2, "fear": -3, "disgust": -3}
    emotion_scores = [emotion_mapping.get(emotion, 0) for emotion in emotions]

    smoothed_scores = gaussian_filter1d(emotion_scores, sigma=2)

    fig = make_subplots(rows=2, cols=1, shared_xaxes=True, vertical_spacing=0.1,
                        row_heights=[0.7, 0.3])

    # 일치하는 점과 불일치하는 점을 분리
    match_times = [t for t, s in zip(timestamps, match_status) if s == "✅ 일치"]
    match_scores = [s for s, status in zip(emotion_scores, match_status) if status == "✅ 일치"]
    mismatch_times = [t for t, s in zip(timestamps, match_status) if s == "❌ 불일치"]
    mismatch_scores = [s for s, status in zip(emotion_scores, match_status) if status == "❌ 불일치"]

    # 일치하는 점
    fig.add_trace(
        go.Scatter(x=match_times, y=match_scores, mode='markers',
                   marker=dict(size=10, color='green', symbol='circle'),
                   name='일치'),
        row=1, col=1
    )

    # 불일치하는 점
    fig.add_trace(
        go.Scatter(x=mismatch_times, y=mismatch_scores, mode='markers',
                   marker=dict(size=10, color='red', symbol='x'),
                   name='불일치'),
        row=1, col=1
    )

    # 스무딩된 감정 변화 추세선
    fig.add_trace(
        go.Scatter(x=timestamps, y=smoothed_scores, mode='lines',
                   line=dict(color='blue', width=2),
                   name='감정 변화 추세'),
        row=1, col=1
    )

    # 대사 표시 (샘플링)
    sample_rate = max(1, len(texts) // 20)
    sampled_texts = texts[::sample_rate]
    sampled_timestamps = timestamps[::sample_rate]

    fig.add_trace(
        go.Scatter(x=sampled_timestamps, y=[0] * len(sampled_timestamps), mode='markers+text',
                   marker=dict(symbol='circle', size=8, color='blue'),
                   text=sampled_texts,
                   textposition='top center',
                   name='대사'),
        row=2, col=1
    )

    emotion_labels = {3: "행복", 2: "놀람", 1: "중립", -1: "슬픔", -2: "분노", -3: "공포/혐오"}
    fig.update_layout(
        title="감정과 발화 내용 일치도",
        height=800,
        showlegend=True,
        hovermode="closest"
    )

    fig.update_yaxes(title_text="감정 점수", row=1, col=1,
                     ticktext=[emotion_labels[score] for score in sorted(emotion_labels.keys())],
                     tickvals=sorted(emotion_labels.keys()))
    fig.update_yaxes(title_text="대사", showticklabels=False, row=2, col=1)
    fig.update_xaxes(title_text="시간 (초)", row=2, col=1,
                     tickmode='array',
                     tickvals=np.arange(0, max(timestamps) + 60, 60),
                     ticktext=[f"{int(t/60)}:{int(t%60):02d}" for t in np.arange(0, max(timestamps) + 60, 60)])

    fig.show()

if __name__ == "__main__":
    try:
        video_path = "downloads/sample_video.mp4"
        
        analyze_video_with_feedback(video_path)
        stt_data = load_stt_results()
        emotion_data = load_emotion_results()

        if stt_data and emotion_data:
            comparison_results = compare_emotion_and_speech(stt_data, emotion_data)
            visualize_emotion_speech_comparison(comparison_results)
        else:
            print("🚨 데이터 불러오기 실패: 감정-대사 비교 불가")
    except Exception as e:
        print(f"오류 발생: {e}")
        import traceback
        traceback.print_exc()