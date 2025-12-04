# --- Stage 1: build ---
    FROM node:20-alpine AS builder
    WORKDIR /app
    
    # Устанавливаем зависимости
    COPY package*.json ./
    RUN npm ci
    
    # Копируем исходники и Prisma schema
    COPY . .
    
    # На всякий случай генерим Prisma Client внутри образа
    RUN npx prisma generate
    RUN npm run build
    
    # --- Stage 2: runtime ---
    FROM node:20-alpine AS runner
    WORKDIR /app
    
    ENV NODE_ENV=production
    
    # Только prod-зависимости
    COPY package*.json ./
    RUN npm ci --omit=dev
    
    # Копируем билд и Prisma client
    COPY --from=builder /app/dist ./dist
    COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
    
    # В k8s ты будешь передавать переменные через Secret/ConfigMap,
    # поэтому .env внутрь образа лучше НЕ класть.
    # Локально, если очень хочется, можно раскомментировать:
    # COPY .env ./.env
    
    CMD ["node", "dist/main.js"]