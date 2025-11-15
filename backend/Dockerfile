# Берём Node.js
FROM node:20-alpine

# Рабочая директория внутри контейнера
WORKDIR /app

# Ставим зависимости один раз
COPY package*.json ./
RUN npm ci

# Копируем все файлы проекта (код + tsconfig)
COPY tsconfig*.json ./
COPY src ./src

# Открываем порт для backend
EXPOSE 3000

# Для локальной разработки с watch
CMD ["npm", "run", "start:dev"]