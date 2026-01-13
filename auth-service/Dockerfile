# 🏗 Build stage: собираем приложение (TS -> JS) и генерируем Prisma Client
FROM node:20-alpine AS build
WORKDIR /app

# 1) Зависимости (для сборки нужны devDependencies)
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# 2) Prisma Client (для компиляции/рантайма)
RUN npx prisma generate

# 3) Исходники + сборка
COPY tsconfig*.json ./
COPY src ./src
RUN npm run build


# 📦 Prod deps stage: ставим ТОЛЬКО production зависимости
FROM node:20-alpine AS prod-deps
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

# ✅ Только production зависимости (без devDependencies)
RUN npm ci --omit=dev

# ✅ Prisma Client должен существовать и в runtime-окружении
RUN npx prisma generate


# 🚀 Runtime stage: минимальный образ для Kubernetes/Prod
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

# (Опционально, но часто нужно для Prisma/SSL в alpine. Если у тебя всё работает без этого — можешь убрать.)
# RUN apk add --no-cache openssl libc6-compat

# ✅ Копируем только нужное для запуска
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/prisma ./prisma
COPY --from=build /app/dist ./dist
COPY package*.json ./

EXPOSE 3000

# ✅ Не root: у node:20-alpine уже есть пользователь "node"
USER node

CMD ["node", "dist/main.js"]