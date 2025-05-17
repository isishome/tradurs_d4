# alpine 18 버전 기반 빌더
FROM node:16-alpine AS builder

# 작업 디렉토리
WORKDIR /d4-proj

# 코드 복사
COPY . .

# 의존성 설치 및 프로젝트 빌드
RUN npm ci && npx quasar build -m ssr

# ssr 의존성 설치
WORKDIR /d4-proj/dist/ssr

RUN npm install

# alpine 18 버전 기반
FROM node:16-alpine

# 작업 디렉토리
WORKDIR /d4

COPY --from=builder /d4-proj/dist/ssr /d4

# 포트 명시
EXPOSE 6090

# node 실행
ENTRYPOINT ["node", "index.js"]