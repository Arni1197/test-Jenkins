# ---------- Build ----------
    FROM node:20-alpine AS builder
    WORKDIR /app
    COPY package*.json ./
    RUN npm ci
    COPY . .
    RUN npm run build    # генерирует dist/ и dist/src/main.js (по твоей структуре)
    
    # ---------- Runtime ----------
    FROM node:20-alpine
    WORKDIR /app
    ENV NODE_ENV=production
    COPY package*.json ./
    RUN npm ci --omit=dev
    COPY --from=builder /app/dist ./dist
    EXPOSE 3000
    # Важно: запускаем то, что у тебя реально есть
    CMD ["node","/app/dist/src/main.js"]