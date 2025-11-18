# 🏗 Этап сборки
FROM node:20-alpine AS build
WORKDIR /app

# Ставим зависимости для сборки
COPY package*.json ./
RUN npm ci

# Копируем исходники и конфиги
COPY tsconfig*.json ./
COPY src ./src

# Собираем NestJS в dist/
RUN npm run build

# 🚀 Прод-образ
FROM node:20-alpine
WORKDIR /app

# Только prod-зависимости
COPY package*.json ./
RUN npm ci --omit=dev

# Кладём только уже собранный код
COPY --from=build /app/dist ./dist

# Открываем порт (если твой Nest реально слушает 3000)
EXPOSE 3000

# Запускаем прод-режим, БЕЗ watch
CMD ["npm", "run", "start:prod"]
# или:
# CMD ["node", "dist/main.js"]