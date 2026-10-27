FROM node:24.22.1-alpine

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 6090

# Pinned Node 24 (includes the CVE-2026-111497 Brotli fix); global Web Crypto is built in.
ENTRYPOINT ["node", "--max-old-space-size=100", "index.js"]