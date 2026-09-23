FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY . .

# โฟลเดอร์เก็บรูปที่แอดมินอัปโหลด (ควร mount volume ทับตอนรัน)
RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "server.js"]
