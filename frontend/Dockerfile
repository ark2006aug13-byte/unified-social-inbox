FROM node:20-alpine AS builder

WORKDIR /app/frontend

COPY frontend/package.json ./package.json
RUN npm install

COPY frontend ./

ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app/frontend
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/frontend ./

EXPOSE 3000

CMD ["npm", "run", "start"]
