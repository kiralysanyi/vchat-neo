FROM node:24-slim

WORKDIR /

COPY package*.json ./

RUN npm install --production

COPY . .

CMD ["node", "main.js"]
