#!/usr/bin/env bash
# ───────────────────────────────────────────────────────────
# 数据库写入权限诊断 + 自动修复
# 用法：bash scripts/fix-db-permissions.sh
# ───────────────────────────────────────────────────────────
set -e
cd "$(dirname "$0")/.."

echo "▶ 数据库权限诊断"
echo ""

# 从 .env 读 DATABASE_URL
if [ ! -f .env ]; then
  echo "✗ 找不到 .env"
  exit 1
fi

DB_URL=$(grep -E "^DATABASE_URL=" .env | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
DB_FILE="${DB_URL#file:}"
DB_FILE="${DB_FILE#//}"
if [ -z "$DB_FILE" ] || [ "$DB_FILE" = "$DB_URL" ]; then
  echo "✗ DATABASE_URL 不是 file: 形式: $DB_URL"
  exit 1
fi

DB_DIR="$(dirname "$DB_FILE")"

echo "数据库文件路径: $DB_FILE"
echo "数据库父目录:   $DB_DIR"
echo ""

if [ ! -f "$DB_FILE" ]; then
  echo "⚠ 数据库文件不存在（可能还没灌种子）。先运行 bash deploy.sh"
  exit 0
fi

echo "▶ 当前文件信息："
ls -la "$DB_FILE"
echo ""

echo "▶ 当前进程用户: $(whoami)"
echo ""

# 检测 PM2 运行用户
PM2_USER=$(pm2 jlist 2>/dev/null | grep -o '"user":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
if [ -n "$PM2_USER" ]; then
  echo "▶ PM2 进程运行用户: $PM2_USER"
else
  echo "▶ PM2 未运行或无法检测用户，假设为 www"
  PM2_USER="www"
fi
echo ""

# 检查写权限
echo "▶ 写权限检查："
if [ -w "$DB_FILE" ]; then
  echo "  ✓ 当前用户可写 DB 文件"
else
  echo "  ✗ 当前用户不可写 DB 文件"
fi

# SQLite 需要在同目录创建 journal/wal 文件，所以目录也要可写
if [ -w "$DB_DIR" ]; then
  echo "  ✓ 当前用户可写 DB 目录"
else
  echo "  ✗ 当前用户不可写 DB 目录"
fi

# 用 node 测试实际写入
echo ""
echo "▶ 实际写入测试（用 Prisma 写一条测试记录然后删除）..."
node -e "
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
(async () => {
  try {
    // 找一个 form 来测试写
    const form = await db.form.findFirst();
    if (!form) { console.log('  ⚠ 无表单可测，跳过写测试（DB 可能是空的）'); return; }
    const before = await db.formField.count({ where: { formId: form.id } });
    const f = await db.formField.create({ data: { formId: form.id, label: '__perm_test__', name: '__perm_test__', type: 'text', required: false, order: 999, config: '{}' } });
    await db.formField.delete({ where: { id: f.id } });
    console.log('  ✓ 数据库写入测试通过（Prisma create + delete 成功）');
  } catch (e) {
    console.log('  ✗ 数据库写入失败:', e.message.split('\\n')[0]);
    if (/readonly|read.?only|disk I\/O|SQLITE_READONLY/i.test(e.message)) {
      console.log('  → 这是 SQLite 权限问题');
    }
  } finally { await db.\$disconnect(); }
})();
" 2>&1 | head -5

echo ""
echo "──────────────────────────────────────────────"
echo "如需修复权限，执行："
echo ""
echo "  # 把 DB 文件和目录改成 PM2 用户（www）拥有"
echo "  chown -R $PM2_USER:$PM2_USER \"$DB_DIR\""
echo ""
echo "  # 或最宽松（不推荐生产长期用，但能立即解决）"
echo "  chmod 664 \"$DB_FILE\""
echo "  chmod 775 \"$DB_DIR\""
echo "  chown -R $PM2_USER:$PM2_USER \"$DB_DIR\""
echo ""
echo "  # 改完重启 PM2"
echo "  pm2 restart audiocenter"
echo "──────────────────────────────────────────────"
