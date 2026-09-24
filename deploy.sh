#!/usr/bin/env bash
# ───────────────────────────────────────────────────────────
# AudioCenter CMS — 一键部署脚本（适配宝塔面板 / 任意 Linux）
#
# 用法：
#   1. SSH 登录服务器
#   2. cd /www/wwwroot/hlaproaudio  （或你 clone 的目录）
#   3. bash deploy.sh               # 首次部署 / 拉取更新后重新部署
#
# 本脚本幂等可重复执行：会自动 install / build / 推数据库 / 重启 PM2。
# 改进点：
#   - 从 .env 读 DATABASE_URL，按实际 DB 文件是否存在决定是否灌种子
#     （不再依赖固定位置的 flag 文件，DB 放哪都行）
#   - 自动确保 DB 父目录存在
#   - build 后自动拷贝 .env 到 .next/standalone/（防 next build 重建目录丢失）
#   - 不覆盖用户自定义的 ecosystem.config.js（已 gitignore，用户拥有）
# ───────────────────────────────────────────────────────────
set -euo pipefail

# 颜色
C_GREEN='\033[0;32m'; C_CYAN='\033[0;36m'; C_YELLOW='\033[1;33m'; C_RED='\033[0;31m'; C_RST='\033[0m'
log()  { echo -e "${C_CYAN}▶${C_RST} $*"; }
ok()   { echo -e "${C_GREEN}✓${C_RST} $*"; }
warn() { echo -e "${C_YELLOW}!${C_RST} $*"; }
err()  { echo -e "${C_RED}✗${C_RST} $*" >&2; }

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# ── 1. 检查环境 ───────────────────────────────────────────
log "检查运行环境..."
if ! command -v node &>/dev/null; then
  err "未检测到 Node.js。请在宝塔「软件商店」安装 Node.js 版本管理器并装 Node 18+。"
  exit 1
fi
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 18 ]; then
  err "Node 版本过低 ($(node -v))，需要 18+。请在宝塔切换 Node 版本。"
  exit 1
fi
ok "Node: $(node -v)"

# 国内服务器访问 npm 官方源不稳定，自动切淘宝镜像（仅当当前源是官方源时）
CURRENT_REGISTRY=$(npm config get registry 2>/dev/null || echo "")
if echo "$CURRENT_REGISTRY" | grep -q "registry.npmjs.org"; then
  warn "检测到 npm 使用官方源，国内访问可能超时，自动切换到淘宝镜像..."
  npm config set registry https://registry.npmmirror.com
  ok "npm 源: https://registry.npmmirror.com"
fi

# 包管理器：优先 bun，否则 npm
if command -v bun &>/dev/null; then
  PKG=bun; ok "检测到 bun: $(bun --version)"
else
  PKG=npm; warn "未检测到 bun，使用 npm（如需更快构建，可 curl -fsSL https://bun.sh/install | bash）"
fi

# ── 2. 校验 .env ──────────────────────────────────────────
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    warn "未发现 .env，从 .env.example 复制一份，请编辑后再运行！"
    cp .env.example .env
    err "请编辑 .env 设置 ADMIN_PASSWORD 与 NEXTAUTH_SECRET 后重新运行本脚本。"
    exit 1
  else
    err "缺少 .env 文件，请按文档创建。"
    exit 1
  fi
fi

# 检查默认密码是否被改
if grep -q "请改成强密码" .env 2>/dev/null; then
  err "检测到 .env 中 ADMIN_PASSWORD 仍是默认占位符『请改成强密码』，请先改成真实密码！"
  exit 1
fi
ok ".env 已配置"

# 从 .env 解析 DATABASE_URL，确定实际 DB 文件路径（用户可能改成绝对路径）
DB_URL=$(grep -E "^DATABASE_URL=" .env | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
DB_FILE="${DB_URL#file:}"   # 去掉 file: 前缀
DB_FILE="${DB_FILE#//}"      # 去掉可能的 // 前缀（绝对路径）
if [ -z "$DB_FILE" ] || [ "$DB_FILE" = "$DB_URL" ]; then
  # DATABASE_URL 不是 file: 形式（可能是 mysql: 等），用默认路径做兜底
  DB_FILE="db/custom.db"
fi
ok "数据库文件路径: $DB_FILE"

# 确保 DB 父目录存在（绝对/相对路径都支持）
DB_DIR="$(dirname "$DB_FILE")"
mkdir -p "$DB_DIR" logs
ok "DB 目录已确保存在: $DB_DIR"

# ── 3. 安装依赖 ───────────────────────────────────────────
log "安装依赖 (这可能需要几分钟)..."
if [ "$PKG" = "bun" ]; then
  bun install --frozen-lockfile 2>/dev/null || bun install
else
  npm ci 2>/dev/null || npm install
fi
ok "依赖安装完成"

# ── 4. 推送数据库 schema（首次会自动建表）────────────────
log "初始化数据库 schema..."
if [ "$PKG" = "bun" ]; then
  bun run db:push
  bun run db:generate
else
  npx prisma db push --accept-data-loss
  npx prisma generate
fi
ok "数据库 schema 已同步"

# ── 5. 首次灌入种子数据（仅当 DB 无数据时） ───────────────
# 注意：不能用「文件是否存在/非空」判断，因为 prisma db push 会创建
# 有表结构但 0 行数据的 DB 文件。必须查 Page 表行数。
log "检查是否需要灌入种子数据..."
PAGE_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
db.page.count().then(c => { process.stdout.write(String(c)); return db.\$disconnect(); }).catch(() => { process.stdout.write('0'); return db.\$disconnect(); });
" 2>/dev/null || echo "error")

if [ "$PAGE_COUNT" = "error" ] || [ "$PAGE_COUNT" = "0" ]; then
  warn "DB 无页面数据 (Page 表 $PAGE_COUNT 行)，将灌入种子数据..."
  if [ "$PKG" = "bun" ]; then
    bun run scripts/seed.ts
  else
    npx --yes tsx scripts/seed.ts
  fi
  ok "种子数据已灌入"
else
  ok "DB 已有 $PAGE_COUNT 个页面，跳过种子（如需重置：rm -f $DB_FILE && bash deploy.sh）"
fi

# ── 5.5 修复 SQLite 文件权限（防止 PM2 以 www 用户跑时读 OK 写失败） ──
# prisma db push / seed 以 root 跑，DB 文件 owner 是 root；
# PM2 进程以 www 跑 → 能读不能写 → 表单/内容块保存报错
log "检查/修复 SQLite 文件权限..."
# 检测 PM2 进程用户
PM2_USER=""
if command -v pm2 &>/dev/null; then
  PM2_USER=$(pm2 jlist 2>/dev/null | grep -o '"user":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
fi
if [ -z "$PM2_USER" ]; then
  PM2_USER="www"  # 宝塔默认
  warn "未检测到 PM2 用户，假设为 $PM2_USER"
fi

if [ -f "$DB_FILE" ]; then
  CURRENT_OWNER=$(stat -c '%U' "$DB_FILE" 2>/dev/null || stat -f '%Su' "$DB_FILE" 2>/dev/null || echo "")
  if [ "$CURRENT_OWNER" != "$PM2_USER" ] && [ -n "$CURRENT_OWNER" ]; then
    warn "DB 文件 owner=$CURRENT_OWNER，但 PM2 以 $PM2_USER 运行 → 自动修复权限..."
    chown -R "$PM2_USER":"$PM2_USER" "$DB_DIR" 2>/dev/null && ok "已 chown -R $PM2_USER:$PM2_USER $DB_DIR" || {
      # chown 可能因权限失败，兜底用 chmod
      chmod -R 775 "$DB_DIR" 2>/dev/null && ok "已 chmod 775 $DB_DIR"
    }
  else
    ok "DB 文件权限正常 (owner=$CURRENT_OWNER)"
  fi
  # 确保 DB 文件和目录对 PM2 用户可写
  chmod 664 "$DB_FILE" 2>/dev/null || true
  chmod 775 "$DB_DIR" 2>/dev/null || true
fi

# ── 6. 构建生产产物 ──────────────────────────────────────
log "构建生产版本 (Next.js standalone)..."
if [ "$PKG" = "bun" ]; then
  bun run build
else
  npm run build
fi
ok "构建完成 → .next/standalone/server.js"

# build 后把 .env 拷贝到 standalone 目录（next build 每次会重建此目录，导致手动放的 .env 丢失）
# 这样即使不用 PM2 env 注入，standalone server 也能读到
if [ -f ".env" ] && [ -d ".next/standalone" ]; then
  cp .env .next/standalone/.env
  ok "已同步 .env → .next/standalone/.env"
fi

# ── 7. 启动 / 重启 PM2 ──────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  warn "未检测到 PM2，正在全局安装..."
  if [ "$PKG" = "bun" ]; then
    bun add -g pm2 2>/dev/null || npm install -g pm2
  else
    npm install -g pm2
  fi
fi
ok "PM2: $(pm2 --version)"

# 如果用户没有自定义 ecosystem.config.js，从 example 拷一份
if [ ! -f "ecosystem.config.js" ] && [ -f "ecosystem.config.example.js" ]; then
  warn "未发现 ecosystem.config.js，从 example 模板拷贝一份..."
  cp ecosystem.config.example.js ecosystem.config.js
  ok "已生成 ecosystem.config.js（如需自定义 env，直接编辑此文件，不会被 git 覆盖）"
fi

log "启动/重启进程..."
if [ -f "ecosystem.config.js" ]; then
  pm2 startOrReload ecosystem.config.js --update-env 2>/dev/null || pm2 start ecosystem.config.js --update-env
else
  # 兜底：直接启动 standalone server（env 从 .env 或系统环境变量读）
  pm2 start .next/standalone/server.js --name audiocenter --update-env 2>/dev/null \
    || pm2 reload audiocenter --update-env 2>/dev/null \
    || pm2 start .next/standalone/server.js --name audiocenter
fi
pm2 save 2>/dev/null || true
ok "进程已守护"

# 健康检查
log "健康检查..."
sleep 2
if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ 2>/dev/null | grep -q "^2"; then
  ok "应用已启动：http://127.0.0.1:3000/"
else
  warn "应用可能还在启动中，10 秒后再次检查..."
  sleep 10
  if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ 2>/dev/null | grep -q "^2"; then
    ok "应用已启动：http://127.0.0.1:3000/"
  else
    warn "健康检查未通过，可运行：pm2 logs audiocenter --lines 50 排查"
  fi
fi

# ── 8. 后续步骤提示 ─────────────────────────────────────
cat <<EOF

${C_GREEN}═══════════════════════════════════════════════════════════${C_RST}
${C_GREEN}  ✅ 部署完成！${C_RST}
${C_GREEN}═══════════════════════════════════════════════════════════${C_RST}

  应用本地地址：  http://127.0.0.1:3000/
  管理后台：      http://127.0.0.1:3000/admin
  数据库文件：    $DB_FILE

${C_YELLOW}下一步在宝塔面板完成外网访问：${C_RST}

  1. 宝塔「网站」→「添加站点」→ 域名填你的域名，纯静态即可
  2. 站点设置 → 反向代理 → 添加反向代理：
       - 代理名称：audiocenter
       - 目标URL： http://127.0.0.1:3000
       - 发送域名：\$host
  3. 站点设置 → SSL → 申请 Let's Encrypt 免费证书
  4. 强制 HTTPS 打开

${C_CYAN}常用运维命令：${C_RST}
  pm2 status                  查看进程状态
  pm2 logs audiocenter        查看实时日志
  pm2 restart audiocenter     重启应用
  pm2 stop audiocenter        停止应用
  bash deploy.sh              拉取代码更新后重新部署

${C_CYAN}重置数据库（清空所有数据，慎用）：${C_RST}
  rm -f $DB_FILE && bash deploy.sh

${C_CYAN}备份：${C_RST}
  - 数据库：$DB_FILE  （SQLite 单文件，直接 cp 备份）
  - 上传图片：public/uploads/  （整目录打包）

EOF
