# 🏗 Этап сборки
FROM node:20-alpine AS build
WORKDIR /app

# 1. Кладём package*.json
COPY package*.json ./

# 2. Кладём Prisma-схему (ОБЯЗАТЕЛЬНО до generate)
COPY prisma ./prisma

# 3. Ставим все зависимости (включая dev, где лежит prisma CLI)
RUN npm ci

# 4. Генерируем Prisma Client
RUN npx prisma generate

# 5. Кладём tsconfig и исходники
COPY tsconfig*.json ./
COPY src ./src

# 6. Собираем NestJS в dist/
RUN npm run build


# 🚀 Прод-образ
FROM node:20-alpine
WORKDIR /app

# package*.json — просто чтобы были внутри образа
COPY package*.json ./

# Берём готовые node_modules (вместе с сгенерированным Prisma Client)
COPY --from=build /app/node_modules ./node_modules

# ⚠️ ВАЖНО: кладём Prisma-схему и миграции
COPY --from=build /app/prisma ./prisma

# Кладём собранный dist
COPY --from=build /app/dist ./dist

EXPOSE 3000

# Запуск
CMD ["node", "dist/main.js"]