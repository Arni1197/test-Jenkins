# ====== Build stage ======
FROM node:20-alpine AS build
WORKDIR /app

# 1) deps (детерминированно)
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# 2) код + билд
COPY . .
RUN npm run build


# ====== Runtime stage ======
FROM nginx:alpine

# SPA-конфиг, чтобы react-router работал (иначе 404 на прямых ссылках)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# статические файлы
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]