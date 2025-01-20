from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "FastAPI AI server is running!"}

@app.post("/predict/")
def predict(data: dict):
    # 간단한 예제: 데이터 반환
    return {"received_data": data}
