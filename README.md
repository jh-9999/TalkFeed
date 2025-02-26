# TalkFeed

# 필수 프로그램
python 3.12\
node.js

# aip 키
openai, aws 키 필요\
키의 파일명은 `.env`\
`ai/`폴더에 openai, aws 키 위치\
`backend/src/`폴더에 openai 키 위치


# 라이브러리 설치
`pip install -r requirements.txt`


# 실행
터미널 3개 필요\
명령어 실행 위치\
TalkFeed/Ai>`uvicorn end:app --reload --host 0.0.0.0 --port 8000`\
TalkFeed/Frontend/>`npm start`\
TalkFeed/backend/src/>`node index.js`

# Error

**npm 실행 시**\
my-app@0.1.0 start\
react-scripts start\
'react-scripts'은(는) 내부 또는 외부 명령, 실행할 수 있는 프로그램, 또는 배치 파일이 아닙니다.\
error 발생 -> `npm i`

**react 페이지 접속 시**\
error 발생 -> `npm install chart.js react-chartjs-2`

**동영상 업로드 시 동영상 이름은 영어로**
