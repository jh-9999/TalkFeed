# 1단계: Node 환경에서 React 앱 빌드
FROM node:16 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2단계: Nginx 이미지에 빌드 결과 및 커스텀 Nginx 설정 복사
FROM nginx:alpine

# 기본 설정 파일 삭제 (읽기 전용 문제 회피)
RUN rm -f /etc/nginx/conf.d/default.conf

# Nginx가 사용하는 모든 임시 디렉토리를 생성하고 권한 부여
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

# 커스텀 nginx.conf (PID 파일 위치가 /tmp/nginx.pid로 설정된 파일) 복사
COPY nginx.conf /etc/nginx/nginx.conf

# (또는 만약 server 블록 설정이 default.conf에 있다면)
# COPY default.conf /etc/nginx/conf.d/default.conf

# 빌드 스테이지에서 생성된 정적 파일 복사
COPY --from=build /app/build /usr/share/nginx/html

# 원하는 포트 노출 (예: 8080)
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
