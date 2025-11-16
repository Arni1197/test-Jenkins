# 1️⃣ Stage: Build React (CRA)
FROM node:20-alpine AS builder
WORKDIR /app

# сначала только package*.json — кеш npm install
COPY package*.json ./
RUN npm install

# теперь копируем весь код
COPY . .

# билдим CRA → появится /app/build
RUN npm run build

# 2️⃣ Stage: Nginx для отдачи статики
FROM nginx:alpine

# копируем build из первого этапа в Nginx
COPY --from=builder /app/build /usr/share/nginx/html

# (опционально) если хочешь SPA-routing и прокси на backend:
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["-g", "daemon off;"]