FROM node:20-alpine AS builder
WORKDIR /app

# 1) Зависимости отдельно для кэша
COPY package*.json ./
RUN npm ci

# 2) Сначала схема Prisma (меняется реже, чем код)
COPY prisma ./prisma
# Если у тебя есть schema в другом месте — подправишь путь
RUN npx prisma generate

# 3) Потом остальной код
COPY . .
RUN npm run build


FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 1) Только prod зависимости
COPY package*.json ./
RUN npm ci --omit=dev

# 2) Билд
COPY --from=builder /app/dist ./dist

# 3) Prisma runtime части
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Если в рантайме нужны файлы prisma (редко, но бывает):
# COPY --from=builder /app/prisma ./prisma

CMD ["node", "dist/main.js"]