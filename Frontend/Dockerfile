# 1단계: Node 환경에서 빌드
FROM node:16 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2단계: Nginx로 정적 파일 서빙
FROM nginx:alpine

# 기본 default.conf 제거(선택)
RUN rm -f /etc/nginx/conf.d/default.conf

# 필요한 임시 디렉토리 생성 및 권한 부여
RUN mkdir -p /var/cache/nginx/client_temp \
    /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp \
    /var/cache/nginx/uwsgi_temp \
    /var/cache/nginx/scgi_temp \
    && chmod -R 777 /var/cache/nginx

# 커스텀 설정(예: default.conf, nginx.conf) 복사
# COPY default.conf /etc/nginx/conf.d/default.conf
# 또는 nginx.conf를 /etc/nginx/nginx.conf 에 복사

# 빌드된 결과물을 Nginx 디렉토리에 복사
COPY --from=build /app/build /usr/share/nginx/html

# EXPOSE 포트는 8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
