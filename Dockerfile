# alpine 16 버전 기반
FROM node:16-alpine

# 작업 디렉토리
WORKDIR /d4-proj

# 코드 복사
COPY . .

# 의존성 설치
RUN npm install && \

# 프로젝트 빌드
    npx quasar build -m ssr

# ssr 의존성 설치
WORKDIR /d4-proj/dist/ssr
RUN npm install && \

# 빌드 정리
    mkdir -p /d4 && \
    cp -r * /d4 && \
    rm -rf /d4-proj

# 서버 구동 준비
WORKDIR /d4

# 포트 명시
EXPOSE 6090

# node 실행
ENTRYPOINT ["node", "index.js"]