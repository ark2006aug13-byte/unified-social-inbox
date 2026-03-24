FROM node:20-alpine

WORKDIR /app/backend

COPY backend/package.json ./package.json
RUN npm install

COPY backend ./
COPY database ../database

RUN npm run prisma:generate

EXPOSE 4000

CMD ["sh", "-c", "npm run prisma:deploy && npm run start"]
