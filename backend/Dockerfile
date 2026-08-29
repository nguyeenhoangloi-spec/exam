# ==========================================
# 1. Base stage: Dependencies & Prisma engine
# ==========================================
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat

# ==========================================
# 2. Dependencies stage
# ==========================================
FROM base AS deps
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --legacy-peer-deps
RUN npx prisma generate

# ==========================================
# 3. Builder stage
# ==========================================
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
COPY prisma ./prisma
RUN npm run build

# ==========================================
# 4. Production Runner stage
# ==========================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Production dependencies only
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev --legacy-peer-deps && npx prisma generate

# Copy built application & assets
COPY --from=builder /app/dist ./dist
COPY scripts ./scripts

# Create upload & backup directory
RUN mkdir -p /app/uploads /app/backup-runtime && chown -R node:node /app

USER node
EXPOSE 3001

CMD ["node", "dist/src/main.js"]
