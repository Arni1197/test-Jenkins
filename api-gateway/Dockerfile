# ====== Build stage ======
FROM node:20-alpine AS build
WORKDIR /app

# 1) Устанавливаем зависимости
COPY package*.json ./
RUN npm ci

# 2) Копируем исходники
COPY tsconfig.json ./
COPY src ./src

# 3) Сборка TypeScript -> dist
RUN npm run build


# ====== Runtime stage ======
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# 1) Ставим только prod зависимости
COPY package*.json ./
RUN npm ci --omit=dev

# 2) Забираем собранный код
COPY --from=build /app/dist ./dist

# 3) Порт gateway
EXPOSE 8080

# 4) Запуск
CMD ["node", "dist/main.js"]