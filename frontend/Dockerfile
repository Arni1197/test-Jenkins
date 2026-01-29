FROM node:20-alpine
WORKDIR /app

# 🛡️ Делает npm более устойчивым к сетевым обрывам
RUN npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && npm config set fetch-timeout 300000

COPY package*.json ./
RUN npm ci

COPY . .
EXPOSE 3000
CMD ["npm", "start"]