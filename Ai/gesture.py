from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import cv2
import mediapipe as mp
import time
import threading

# FastAPI 앱 생성
app = FastAPI()

# CORS 설정 (React와의 통신 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React 앱 주소
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mediapipe 및 Pose 모델 초기화
mp_pose = mp.solutions.pose
pose = mp_pose.Pose()

# 제스처 상태 변수 (스레드에서 공유)
gesture_data = {"count": 0}

# 설정 변수 (매직 넘버 제거)
COOLDOWN_TIME = 10.0  # 제스처 카운트 간격 (초)
SHOULDER_THRESHOLD = 0.3  # 손 위치가 어깨보다 얼마나 높아야 하는지 기준

def analyze_posture():
    """카메라를 통해 사용자 자세를 분석하고 제스처를 카운트합니다."""
    cap = cv2.VideoCapture(0)  # 기본 카메라 사용
    global gesture_data

    # 마지막 제스처 감지 시간
    last_gesture_time = time.time()

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("카메라에서 프레임을 읽을 수 없습니다.")
            break

        # 프레임을 RGB로 변환하여 Mediapipe에 전달
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(image)

        # 자세 랜드마크가 감지된 경우
        if results.pose_landmarks:
            landmarks = results.pose_landmarks.landmark
            h, w, _ = frame.shape

            # 주요 랜드마크 가져오기
            right_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER]
            left_shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]
            right_wrist = landmarks[mp_pose.PoseLandmark.RIGHT_WRIST]
            left_wrist = landmarks[mp_pose.PoseLandmark.LEFT_WRIST]

            # 손 위치가 어깨 기준선보다 높은지 확인
            right_hand_excessive = right_wrist.y < right_shoulder.y - SHOULDER_THRESHOLD
            left_hand_excessive = left_wrist.y < left_shoulder.y - SHOULDER_THRESHOLD

            # 현재 시간 가져오기
            current_time = time.time()

            # 과도한 제스처가 감지되고 쿨다운 시간이 지난 경우
            if (right_hand_excessive or left_hand_excessive) and (current_time - last_gesture_time) > COOLDOWN_TIME:
                gesture_data["count"] += 1
                last_gesture_time = current_time

        # 'q' 키를 누르면 종료
        if cv2.waitKey(10) & 0xFF == ord('q'):
            print("제스처 분석을 종료합니다.")
            break

    cap.release()
    cv2.destroyAllWindows()

# 백그라운드에서 analyze_posture 실행
threading.Thread(target=analyze_posture, daemon=True).start()

@app.get("/gesture-count")
def get_gesture_count():
    """현재 제스처 카운트를 반환합니다."""
    return {"count": gesture_data["count"]}
