# 1단계: Node 환경에서 React 앱 빌드
FROM node:16 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2단계: Nginx 이미지에 빌드 결과 및 커스텀 Nginx 설정 복사
FROM nginx:alpine

# Nginx 임시 디렉토리 생성 및 권한 설정 (이전 단계 그대로)
RUN mkdir -p /var/cache/nginx/client_temp \
    /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp \
    /var/cache/nginx/uwsgi_temp \
    /var/cache/nginx/scgi_temp \
    && chmod -R 777 /var/cache/nginx/client_temp \
    /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp \
    /var/cache/nginx/uwsgi_temp \
    /var/cache/nginx/scgi_temp

# 커스텀 Nginx 설정 파일 복사 (nginx.conf 파일이 Frontend 폴더에 있다고 가정)
COPY nginx.conf /etc/nginx/nginx.conf

# 빌드 단계에서 생성된 정적 파일 복사
COPY --from=build /app/build /usr/share/nginx/html

# 컨테이너 내부 80번 포트를 노출 (원하는 경우 포트를 8080으로도 변경 가능)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
