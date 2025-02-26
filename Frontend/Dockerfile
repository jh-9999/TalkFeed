# 1단계: Node 환경에서 빌드
FROM node:16 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2단계: Nginx로 정적 파일 서빙
FROM nginx:alpine

# (1) 기존 default.conf 삭제
RUN rm -f /etc/nginx/conf.d/default.conf

# (2) 필요한 임시 디렉토리 생성 및 권한 부여
RUN mkdir -p /var/cache/nginx/client_temp \
    /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp \
    /var/cache/nginx/uwsgi_temp \
    /var/cache/nginx/scgi_temp \
    && chmod -R 777 /var/cache/nginx

# (3) 메인 설정 파일(nginx.conf) 복사
COPY nginx.conf /etc/nginx/nginx.conf

# (선택) server 블록 설정 파일(default.conf) 따로 있다면 복사
# COPY default.conf /etc/nginx/conf.d/default.conf

# (4) 빌드 결과 복사
COPY --from=build /app/build /usr/share/nginx/html

# (5) 포트 설정
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]

