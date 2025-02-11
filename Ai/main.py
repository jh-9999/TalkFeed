from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai
import os

# 환경 변수에서 OpenAI API 키 로드
openai.api_key = os.getenv("OPENAI_API_KEY")

# FastAPI 앱 초기화
app = FastAPI()

# CORS 설정 (React에서 요청 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React 앱 실행 주소
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 요청 데이터 모델 정의
class PresentationRequest(BaseModel):
    topic: str
    purpose: str
    summary: str
    audience: str = "일반 청중"
    duration: str = "5분"
    style: str = "전문적"

def create_presentation_prompt(data: PresentationRequest) -> str:
    """ LLM이 사용할 프롬프트 생성 """
    duration_minutes = int(data.duration.replace("분", "")) if "분" in data.duration else 5
    
    return f"""
    발표 정보:
    - 주제: {data.topic}
    - 목적: {data.purpose}
    - 대상: {data.audience}
    - 발표 시간: {data.duration}
    - 스타일: {data.style}

    전달 내용:
    {data.summary}

    요청:
    {data.duration} 동안 발표할 **충분한 내용**을 포함하여 **자연스럽고 몰입감 있는 발표 스크립트**를 생성해주세요.
    발표 스크립트는 **매우 상세하고 구체적인 내용**을 포함해야 하며, 다음과 같은 구조를 따릅니다:

    **1. 도입부 ({int(duration_minutes * 1.2)}분)**
        - 청중의 관심을 끌기 위한 강렬한 질문, 스토리, 유명한 인용구 활용
        - 발표의 중요성 강조 및 핵심 메시지 전달
        - 발표의 목적 및 기대 효과 설명
        - **배경 정보** 및 관련 맥락 제공
        - 발표의 흐름 미리 안내

    **2. 본론 ({int(duration_minutes * 1.6)}분)**
        - **핵심 내용 전개 (최소 4~5개의 주요 포인트)**  
        - **각 포인트에 최소 4개의 세부 설명 추가 (통계, 사례, 전문가 의견, 비유 등 활용)**
        - **실제 연구 자료, 뉴스, 도표 등 참고하여 정보 제공**
        - 청중과의 상호작용 요소 추가 (질문 유도, 비유, 실습 유도)
        - **각 주요 포인트 사이 자연스럽게 연결하는 문장 추가**

    **3. 결론 ({int(duration_minutes * 1.2)}분)**
        - 핵심 요점 요약 (최대 3문장)
        - 청중이 기억해야 할 가장 중요한 메시지 강조
        - 청중에게 질문 던지기 또는 행동 촉구
        - 발표를 인상적으로 마무리할 강렬한 마무리 문장 포함
    """

@app.get("/")
def read_root():
    return {
        "message": "FastAPI AI server is running!",
        "status": "active",
        "version": "1.0"
    }

@app.post("/ai/predict")
async def predict(data: PresentationRequest):
    """LLM을 호출하여 발표 스크립트 생성"""
    try:
        if not openai.api_key:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")

        prompt = create_presentation_prompt(data)

        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "당신은 청중을 사로잡는 발표 스크립트를 작성하는 전문가입니다."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=3000,  # 🔧 토큰 수 증가 (더 긴 스크립트 생성)
            temperature=0.75,
            presence_penalty=0.6,
            frequency_penalty=0.3
        )
        
        script = response["choices"][0]["message"]["content"]
        
        return {"script": script}

    except openai.error.OpenAIError as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API 오류: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")

# FastAPI 서버 실행
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
