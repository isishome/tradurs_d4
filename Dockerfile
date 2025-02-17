# alpine 20 버전 기반 빌더
FROM node:20-alpine AS builder

# 작업 디렉토리
WORKDIR /d4-proj

# 코드 복사
COPY . .

# 의존성 설치 및 프로젝트 빌드
RUN npm install --jobs=1 && npx quasar build -m ssr && npm cache clean --force

# ssr 의존성 설치
WORKDIR /d4-proj/dist/ssr
RUN npm install --jobs=1 && npm cache clean --force

# alpine 20 버전 기반
FROM node:20-alpine

# 작업 디렉토리
WORKDIR /d4

COPY --from=builder /d4-proj/dist/ssr /d4

# 포트 명시
EXPOSE 6090

# node 실행
ENTRYPOINT ["node", "index.js"]