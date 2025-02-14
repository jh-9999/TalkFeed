from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai
import os

# OpenAI API 키 설정
openai.api_key = os.getenv("OPENAI_API_KEY")

# FastAPI 앱 초기화
app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 요청 데이터 모델
class PresentationRequest(BaseModel):
    topic: str        # 발표 주제
    purpose: str      # 발표 목적
    summary: str      # 전달 내용

def create_presentation_prompt(data: PresentationRequest) -> str:
    return f"""
    발표 정보:
    - 주제: {data.topic}
    - 목적: {data.purpose}
    - 전달 내용: {data.summary}

    위 정보를 바탕으로 자연스럽고 청중이 이해하기 쉬운 발표 스크립트를 작성해주세요.
    도입부, 본론, 결론 구조로 작성해주시되, 청중의 관심을 끌 수 있도록 해주세요.
    """

@app.get("/")
def read_root():
    return {"message": "FastAPI AI server is running!"}

@app.post("/ai/predict")
async def predict(data: PresentationRequest):
    try:
        if not openai.api_key:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")

        prompt = create_presentation_prompt(data)

        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "당신은 자연스럽고 효과적인 발표 스크립트를 작성하는 전문가입니다."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        
        script = response["choices"][0]["message"]["content"]
        return {"script": script}

    except openai.error.OpenAIError as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API 오류: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)