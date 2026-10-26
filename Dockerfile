FROM node:18-alpine

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 6090

# Node 18 has no global Web Crypto by default; Quasar >= 2.27 uid() needs it during SSR.
ENTRYPOINT ["node", "--experimental-global-webcrypto", "--max-old-space-size=100", "index.js"]