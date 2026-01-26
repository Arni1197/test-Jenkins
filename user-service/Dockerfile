# --- Stage 1: build ---
    FROM node:20-alpine AS builder
    WORKDIR /app
    
    # 1) deps for cache
    COPY package*.json ./
    RUN npm ci
    
    # 2) prisma schema first (better cache)
    COPY prisma ./prisma
    RUN npx prisma generate
    
    # 3) rest of sources
    COPY . .
    RUN npm run build
    
    
    # --- Stage 2: runtime ---
    FROM node:20-alpine AS runner
    WORKDIR /app
    ENV NODE_ENV=production
    
    # only prod deps
    COPY package*.json ./
    COPY prisma ./prisma
    RUN npm ci --omit=dev
    
    # ✅ Prisma runtime engines/client
    RUN npx prisma generate
    
    # app build
    COPY --from=builder /app/dist ./dist
    
    # ✅ ✅ ✅ ДОБАВЛЕНО: папка для file-логов + права под node
    RUN mkdir -p /app/logs && chown -R node:node /app
    
    # ✅ non-root
    USER node
    
    EXPOSE 3000
    CMD ["node", "dist/main.js"]