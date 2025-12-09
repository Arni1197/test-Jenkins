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
    RUN npm ci --omit=dev
    
    # app build
    COPY --from=builder /app/dist ./dist
    
    # prisma runtime bits
    COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
    COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
    
    # если вдруг в рантайме нужны файлы prisma:
    # COPY --from=builder /app/prisma ./prisma
    
    CMD ["node", "dist/main.js"]