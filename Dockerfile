FROM node:24-slim

WORKDIR /

COPY build/package*.json ./

RUN npm install --production

COPY build/ .

CMD ["node", "main.js"]
