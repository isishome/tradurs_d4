# alpine 18 버전 기반 빌더
FROM node:18-alpine AS builder

# 작업 디렉토리
WORKDIR /d4-proj

# 코드 복사
COPY . .

# 환경 변수 설정 (메모리 제한)
ENV NODE_OPTIONS="--max-old-space-size=512"

# 의존성 설치 및 프로젝트 빌드
RUN nice -n 10 npm install && nice -n 10 npx quasar build -m ssr && nice -n 10 npm cache clean --force

# ssr 의존성 설치
WORKDIR /d4-proj/dist/ssr

# 환경 변수 설정 (메모리 제한)
ENV NODE_OPTIONS="--max-old-space-size=512"

RUN nice -n 10 npm install && nice -n 10 npm cache clean --force

# alpine 18 버전 기반
FROM node:18-alpine

# 작업 디렉토리
WORKDIR /d4

COPY --from=builder /d4-proj/dist/ssr /d4

# 포트 명시
EXPOSE 6090

# node 실행
ENTRYPOINT ["node", "index.js"]