# 🏗 Build stage: deps + prisma generate + build
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# Prisma Client генерим тут (где есть dev deps)
RUN npx prisma generate

COPY tsconfig*.json ./
COPY src ./src
RUN npm run build


# 🚀 Runtime: берём build и выкидываем dev deps
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# берём всё, что нужно, из build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/dist ./dist
COPY package*.json ./

# удаляем dev deps (получаем prod node_modules)
RUN npm prune --omit=dev \
  && mkdir -p /app/logs \
  && chown -R node:node /app

USER node
EXPOSE 3003
CMD ["node", "dist/src/main.js"]