# ───────────────────────────────────────────────────────────
# AudioCenter CMS — 多阶段 Dockerfile
# 用法：docker compose up -d --build
# ───────────────────────────────────────────────────────────

# ── Stage 1: 构建 ──
FROM node:20-slim AS builder
WORKDIR /app

# 先拷贝依赖清单，利用层缓存
COPY package.json bun.lock* package-lock.json* ./
COPY prisma ./prisma
RUN npm ci || npm install

# 拷贝源码
COPY . .

# 生成 Prisma client + 构建生产产物
RUN npx prisma generate
RUN npm run build

# ── Stage 2: 运行时 ──
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# 安装最小运行依赖
RUN apt-get update -qq && apt-get install -y --no-install-recommends \
    openssl ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

# 拷贝 standalone 产物 + 静态资源 + 数据库 + 脚本
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/ecosystem.config.js ./ecosystem.config.js
COPY --from=builder /app/package.json ./package.json
# standalone 已含 node_modules 子集；保留 prisma 引擎
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma 2>/dev/null || true
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma 2>/dev/null || true

# 持久化目录
RUN mkdir -p db logs public/uploads
VOLUME ["/app/db", "/app/public/uploads", "/app/logs"]

EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/ || exit 1

# 启动：首次运行自动初始化数据库
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node server.js"]
