# alpine 20 버전 기반
FROM node:20-alpine

# 작업 디렉토리
WORKDIR /d4-proj

# 코드 복사
COPY . .

# 의존성 설치 및 프로젝트 빌드
RUN npm install \
    && npx quasar build -m ssr

# ssr 의존성 설치 및 빌드 정리
WORKDIR /d4-proj/dist/ssr
RUN npm install \
    && mkdir -p /d4 \
    && cp -r * /d4 \
    && rm -rf /d4-proj

# 서버 구동 준비
WORKDIR /d4

# 포트 명시
EXPOSE 6090

# node 실행
ENTRYPOINT ["node", "index.js"]