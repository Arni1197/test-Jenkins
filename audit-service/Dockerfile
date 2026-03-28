FROM node:20-alpine AS build
LABEL org.opencontainers.image.source="https://github.com/Arni1197/test-Jenkins"

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate

COPY tsconfig*.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/dist ./dist
COPY package*.json ./

RUN npm prune --omit=dev && mkdir -p /app/logs && chown -R node:node /app

USER node

CMD ["node", "dist/main.js"]