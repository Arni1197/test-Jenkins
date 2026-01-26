# 🏗 Build stage: dev deps + сборка dist
FROM node:20-alpine AS build
WORKDIR /app

# 1) deps для кеша
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# 2) Prisma Client (для сборки)
RUN npx prisma generate

# 3) код + сборка
COPY tsconfig*.json ./
COPY src ./src
RUN npm run build


# 📦 Prod deps stage: только production deps + Prisma Client
FROM node:20-alpine AS prod-deps
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

# ✅ только prod зависимости
RUN npm ci --omit=dev

# ✅ Prisma Client/engines должны быть внутри runtime node_modules
RUN npx prisma generate


# 🚀 Runtime stage: минимальный запуск без root
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

# ✅ переносим только то, что нужно для запуска
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/prisma ./prisma
COPY --from=build /app/dist ./dist
COPY package*.json ./

# ✅ ✅ ✅ ДОБАВЛЕНО: папка для file-логов + права под пользователя node
RUN mkdir -p /app/logs && chown -R node:node /app

# ✅ не root
USER node

EXPOSE 3000
CMD ["node", "dist/main.js"]