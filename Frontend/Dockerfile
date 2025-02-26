# 1단계: Node 환경에서 빌드
FROM node:16 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2단계: Nginx 이미지에 빌드 결과 복사
FROM nginx:alpine
# Nginx 기본 설정 파일 덮어쓰기를 원한다면 아래처럼 COPY 가능:
# COPY default.conf /etc/nginx/conf.d/default.conf

# 빌드된 결과물을 Nginx html 폴더로 복사
COPY --from=build /app/build /usr/share/nginx/html

# 컨테이너가 80번 포트로 웹 페이지를 서빙
EXPOSE 80

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"]
