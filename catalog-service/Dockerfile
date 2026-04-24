# 🏗 Build stage: deps + prisma generate + build
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci

RUN npx prisma generate

COPY tsconfig*.json ./
COPY src ./src

RUN npm run build


# 🚀 Runtime
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

# tini = корректный PID 1 для сигналов и zombie cleanup
RUN apk add --no-cache tini

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/dist ./dist
COPY package*.json ./

RUN npm prune --omit=dev \
  && npm cache clean --force \
  && mkdir -p /app/logs \
  && chown -R node:node /app

USER node

EXPOSE 3003

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/src/main.js"]