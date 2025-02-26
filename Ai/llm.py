# # llm.py
# import os
# import openai
# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import JSONResponse
# from fastapi.requests import Request
# from starlette.exceptions import HTTPException as StarletteHTTPException
# from fastapi.exceptions import RequestValidationError
# from dotenv import load_dotenv

# # .env 파일 로드 (환경변수 설정)
# load_dotenv()

# # OpenAI API 키를 환경변수에서 불러옵니다.
# openai.api_key = os.getenv("OPENAI_API_KEY")
# if not openai.api_key:
#     raise Exception("OPENAI_API_KEY가 설정되지 않았습니다. 환경변수를 확인하세요.")

# app = FastAPI()

# # CORS 설정: 프론트엔드 주소 (http://localhost:3000)를 허용
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # 에러 응답에도 CORS 헤더 추가 예외 핸들러
# @app.exception_handler(StarletteHTTPException)
# async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
#     return JSONResponse(
#         status_code=exc.status_code,
#         content={"detail": exc.detail},
#         headers={"Access-Control-Allow-Origin": "http://localhost:3000"}
#     )

# @app.exception_handler(RequestValidationError)
# async def validation_exception_handler(request: Request, exc: RequestValidationError):
#     return JSONResponse(
#         status_code=422,
#         content={"detail": exc.errors(), "body": exc.body},
#         headers={"Access-Control-Allow-Origin": "http://localhost:3000"}
#     )

# # 총평 생성 엔드포인트
# @app.post("/generate-feedback")
# async def generate_feedback():
#     # 분석 결과 데이터를 내부 저장소 또는 모듈에서 가져왔다고 가정합니다.
#     analysis_data = """
# [표정 분석 결과]
# - 발표자의 표정은 전반적으로 밝고 긍정적이나, 일부 긴장한 순간이 포착되었습니다.
# - 백데이터 기준: 이전 발표자들의 평균에서는 긍정적 감정(예: 행복, 평온)이 약 60~70% 수준입니다.

# [속도 분석 결과]
# - 발표자의 발화 속도는 청중이 이해하기에 적절한 수준입니다.
# - 백데이터 기준: 평균 발표자들의 세그먼트 지속시간은 약 2.0~2.5초입니다.

# [발음 및 텍스트 비교 결과]
# - Whisper API 기반 텍스트 비교 결과, 전반적으로 발음은 명확하나 일부 단어에서 부정확성이 있습니다.
# - 백데이터 기준: 평균 인식 정확도는 약 95%로 평가됩니다.
# """
#     # 프롬프트 내에 "2~3줄"로 간략하게 작성해달라는 지시문을 추가합니다.
#     prompt = f"""
# 다음 데이터를 바탕으로, 공식적이고 객관적인 스타일로 총평을 한글로 2~3줄 정도로 간략하게 작성해 주세요.
# {analysis_data}

# “발표는 전반적으로 안정적이며 긍정적인 인상을 주었습니다. 표정은 주로 밝았으나 일부 순간에 긴장이 느껴졌고, 발음과 속도 모두 청중이 이해하기에 적절했습니다.”
# """
#     try:
#         response = openai.ChatCompletion.create(
#             model="gpt-4",
#             messages=[
#                 {"role": "system", "content": "당신은 전문적인 발표 평가 전문가입니다."},
#                 {"role": "user", "content": prompt}
#             ],
#             temperature=0.5
#         )
#         summary = response.choices[0].message.content
#         return {"feedback": summary}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run("llm:app", host="0.0.0.0", port=8000, reload=True)
