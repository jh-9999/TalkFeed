# 1단계: Node 환경에서 React 앱 빌드
FROM node:16 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2단계: Nginx 이미지에 빌드 결과 및 커스텀 Nginx 설정 복사
FROM nginx:alpine

# 기본 default.conf 제거 (읽기 전용 이슈를 회피)
RUN rm -f /etc/nginx/conf.d/default.conf

# 필요한 임시 디렉토리 생성 및 권한 부여
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

# 커스텀 default.conf 복사 (포트 8080으로 리슨하도록 설정한 파일)
COPY default.conf /etc/nginx/conf.d/default.conf

# 빌드 단계에서 생성된 정적 파일 복사
COPY --from=build /app/build /usr/share/nginx/html

# 컨테이너 내부 8080 포트를 노출
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
