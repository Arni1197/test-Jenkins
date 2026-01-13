# ====== Build stage ======
FROM node:20-alpine AS build
WORKDIR /app

# 1) Устанавливаем зависимости (dev+prod — нужны для сборки)
COPY package*.json ./
RUN npm ci

# 2) Копируем конфиги и исходники
COPY tsconfig.json ./
COPY src ./src

# 3) Сборка TypeScript -> dist
RUN npm run build


# ====== Prod deps stage (optional but best practice) ======
# Если хочешь максимально чисто, можно не ставить prod deps в runner, а вынести отдельно:
FROM node:20-alpine AS prod-deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev


# ====== Runtime stage ======
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# ✅ только prod зависимости
COPY --from=prod-deps /app/node_modules ./node_modules
COPY package*.json ./

# ✅ собранный код
COPY --from=build /app/dist ./dist

EXPOSE 8080

# ✅ не root
USER node

CMD ["node", "dist/main.js"]