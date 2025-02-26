# 1. Node.js 베이스 이미지 선택 (원하는 버전 사용, 여기서는 Node 16)
FROM node:22

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. package.json과 package-lock.json (있는 경우) 복사
COPY package*.json ./

# 4. 의존성 설치 (npm install)
RUN npm install

# 5. 소스 코드 복사
COPY . .

# 6. 컨테이너 내에서 사용하는 포트 공개 (예: 5000)
EXPOSE 5000

# 7. 애플리케이션 실행 (package.json의 start 스크립트 사용)
CMD ["npm", "start"]
