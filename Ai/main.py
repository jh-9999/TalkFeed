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

class PresentationRequest(BaseModel):
    topic: str      # 발표 주제
    purpose: str    # 발표 목적
    summary: str    # 전달 내용
    duration: str   # 발표 시간

def get_max_tokens(duration: str) -> int:
    """발표 시간에 따른 최대 토큰 수 계산"""
    duration_minutes = int(duration.replace("분", ""))
    words_per_minute = 150
    token_multiplier = 1.3
    return int(duration_minutes * words_per_minute * token_multiplier)

def create_presentation_prompt(data: PresentationRequest) -> tuple:
    token_multiplier = 1.3  # 내부 계산에 사용할 multiplier
    max_tokens = get_max_tokens(data.duration)
    
    # 섹션별 비율 설정 (도입부 20%, 본론 60%, 결론 20%)
    section_tokens = {
        "intro": int(max_tokens * 0.2),
        "main": int(max_tokens * 0.6),
        "conclusion": int(max_tokens * 0.2)
    }
    
    prompt = (
        "다음 조건에 맞는 전문적인 발표 스크립트를 작성해주세요:\n\n"
        f"1. 주제: {data.topic}\n"
        f"2. 발표 목적: {data.purpose}\n"
        f"3. 핵심 전달 내용: {data.summary}\n"
        # 여기서 선택한 발표 시간이 프롬프트에 반영됩니다.
        f"4. 발표 시간: {data.duration}\n\n"
        "스크립트 구조 요구사항:\n"
        "1. 도입부 (전체의 20%):\n"
        "   - 청중의 관심을 끌 수 있는 강력한 시작 (통계, 질문, 일화 등)\n"
        "   - 발표 주제와 목적의 명확한 제시\n"
        "   - 발표 순서 안내\n"
        f"   - 길이: 약 {int(section_tokens['intro'] / token_multiplier)}단어\n\n"
        "2. 본론 (전체의 60%):\n"
        "   - 주요 논점을 2-3개로 명확히 구분\n"
        "   - 각 논점마다 구체적인 예시나 데이터 포함\n"
        "   - 논리적 흐름을 위한 적절한 전환어 사용\n"
        "   - 적절한 비유와 시각적 묘사 포함\n"
        f"   - 길이: 약 {int(section_tokens['main'] / token_multiplier)}단어\n\n"
        "3. 결론 (전체의 20%):\n"
        "   - 핵심 메시지 요약\n"
        "   - 청중에게 남기고 싶은 인상적인 마무리\n"
        "   - 실천 가능한 행동 제안이나 다음 단계 제시\n"
        f"   - 길이: 약 {int(section_tokens['conclusion'] / token_multiplier)}단어\n\n"
        "발표 스타일 요구사항:\n"
        "1. 어조:\n"
        "   - 전문적이면서도 친근한 어조 사용\n"
        "   - 불필요한 전문용어 제외\n"
        "   - 명확하고 간결한 문장 구성\n\n"
        "2. 청중 참여:\n"
        "   - 적절한 수사적 질문 포함\n"
        "   - 청중의 경험과 연결되는 예시 사용\n"
        "   - 상호작용을 유도하는 요소 포함\n\n"
        "3. 표현:\n"
        "   - 구어체와 문어체의 적절한 조화\n"
        "   - 핵심 단어나 문장의 반복을 통한 강조\n"
        "   - 청중의 이해를 돕는 비유와 예시 사용\n\n"
        "출력 형식:\n"
        "제목: [주제를 반영한 인상적인 제목]\n\n"
        "[인사말]\n\n"
        "도입부:\n[도입부 내용]\n\n"
        "본론:\n[본론 내용]\n\n"
        "결론:\n[결론 내용]\n\n"
        "[마무리 인사]"
    )
    
    return prompt, max_tokens

@app.get("/")
def read_root():
    return {"message": "FastAPI AI Presentation Script Generator is running!"}

@app.post("/ai/predict")
async def predict(data: PresentationRequest):
    try:
        if not openai.api_key:
            raise HTTPException(
                status_code=500,
                detail="OpenAI API key not configured"
            )

        prompt, max_tokens = create_presentation_prompt(data)
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "당신은 수준 높은 발표 스크립트 작성 전문가입니다. "
                        "주어진 요구사항에 따라 체계적이고 매력적인 발표 스크립트를 작성해주세요. "
                        "스크립트는 청중의 관심을 사로잡고, 정보를 효과적으로 전달하며, "
                        "강력한 인상을 남길 수 있어야 합니다. "
                        "각 섹션의 길이 제한을 준수하고, "
                        "자연스러운 발표 흐름을 위한 적절한 전환어를 사용하세요."
                    )
                },
                {"role": "user", "content": prompt}
            ],
            max_tokens=max_tokens,
            temperature=0.7
        )
        
        script = response.choices[0].message.content
        return {"script": script}
        
    except openai.error.OpenAIError as e:
        raise HTTPException(
            status_code=500,
            detail=f"OpenAI API 오류: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"서버 오류: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)


