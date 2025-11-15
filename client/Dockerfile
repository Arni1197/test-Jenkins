FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

# НЕ копируем код, он будет через volume монтироваться
# COPY . .

EXPOSE 3000

CMD ["npm", "start"]