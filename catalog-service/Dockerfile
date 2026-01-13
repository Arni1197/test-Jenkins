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
# если у тебя есть другие папки (modules, libs, etc) — добавь COPY
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

# (Опционально, но часто полезно для Prisma/SSL на alpine)
# Если у тебя сейчас всё стабильно — можешь оставить закомментированным.
# RUN apk add --no-cache openssl libc6-compat

# ✅ переносим только то, что нужно для запуска
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/prisma ./prisma
COPY --from=build /app/dist ./dist
COPY package*.json ./

# ✅ не root
USER node

EXPOSE 3000
CMD ["node", "dist/main.js"]