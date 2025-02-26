# 1단계: Node 환경에서 React 앱 빌드
FROM node:16 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2단계: Nginx 이미지로 빌드 결과 서빙
FROM nginx:alpine

# Nginx가 사용하는 임시 디렉토리들을 생성하고 권한 부여
RUN mkdir -p /var/cache/nginx/client_temp && chmod -R 777 /var/cache/nginx/client_temp \
    && mkdir -p /var/cache/nginx/proxy_temp && chmod -R 777 /var/cache/nginx/proxy_temp \
    && mkdir -p /var/cache/nginx/fastcgi_temp && chmod -R 777 /var/cache/nginx/fastcgi_temp

# 필요에 따라 기본 Nginx 설정 파일을 덮어쓸 수 있습니다.
# COPY default.conf /etc/nginx/conf.d/default.conf

# 빌드 단계에서 생성된 정적 파일을 Nginx의 기본 서빙 디렉토리로 복사
COPY --from=build /app/build /usr/share/nginx/html

# 컨테이너 내부 80번 포트 노출
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
