FROM node:20-alpine

WORKDIR /app/backend

COPY backend/package.json ./package.json
RUN npm install --no-audit --no-fund

COPY backend ./
COPY database ../database

RUN npm run prisma:generate

ENV NODE_ENV=production
EXPOSE 4000

# The compose file waits for Postgres to report healthy before this starts.
CMD ["sh", "-c", "npx prisma migrate deploy --schema ../database/prisma/schema.prisma && npm run start"]
