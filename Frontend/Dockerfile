# 1단계: Node 환경에서 React 앱 빌드
FROM node:16 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2단계: Nginx 이미지에 빌드 결과 복사 및 설정 적용
FROM nginx:alpine

# 필요한 임시 디렉토리 생성 및 권한 부여 (이전 단계 그대로 유지)
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

# custom Nginx 설정 파일 복사 (default.conf가 현재 디렉토리에 있다고 가정)
COPY default.conf /etc/nginx/conf.d/default.conf

# 빌드 단계에서 생성된 정적 파일을 Nginx 기본 서빙 디렉토리로 복사
COPY --from=build /app/build /usr/share/nginx/html

# 컨테이너 내부 8080 포트를 노출
EXPOSE 8080

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"]
