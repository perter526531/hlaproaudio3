# AudioCenter CMS — 宝塔面板一键部署指南

> 这是一套**专业音响品牌 CMS 网站**（前台 6 个页面 + 新闻详情 + 后台可视化编辑器），参考 seeburg-audio.cn 与 hlaaudio.cn 设计。前台页面、内容块、表单、图片、菜单全部由后台可视化驱动；后台需登录。

---

## 🎯 三种部署方式（任选其一）

| 方式 | 难度 | 适用场景 |
|---|---|---|
| **A. PM2 + Nginx 反代**（推荐） | ★★ | 宝塔原生，最轻量 |
| **B. Docker Compose** | ★★ | 已装 Docker、想要完全隔离 |
| **C. 纯 Node 直接跑** | ★ | 临时测试 |

三种方式都跑在 **3000 端口**，对外通过宝塔的 **Nginx 反向代理** 暴露到 80/443。

---

## 🅰️ 方式 A：PM2 + Nginx 反代（推荐）

### 第 1 步：宝塔准备软件

登录宝塔面板 → **软件商店**：

1. **安装 Node.js 版本管理器** → 进设置 → 安装一个 **Node 20 LTS**
2. **安装 PM2 管理器**（可选，也可 SSH `npm i -g pm2`）

### 第 2 步：SSH 拉取代码

```bash
# 进入宝塔默认站点目录
cd /www/wwwroot
git clone <你的git仓库地址> audiocenter
cd audiocenter

# 创建环境配置（按提示修改）
cp .env.example .env
vi .env
```

`.env` 必须改的 3 项：
```env
ADMIN_PASSWORD=一个强密码              # 改掉占位符
NEXTAUTH_SECRET=用下面命令生成的随机串   # openssl rand -base64 32
NEXTAUTH_URL=https://你的域名          # 改成最终对外域名
```

### 第 3 步：一键部署

```bash
bash deploy.sh
```

脚本会自动：
- ✅ 检查 Node 版本
- ✅ 安装依赖（优先 bun，无则 npm）
- ✅ 推送数据库 schema + 生成 Prisma client
- ✅ 首次运行灌入种子数据（6 个页面、9 个内容块、2 个表单、6 篇新闻、4 张示例图）
- ✅ 构建生产产物 `.next/standalone/server.js`
- ✅ 用 PM2 启动并守护进程
- ✅ 健康检查 `http://127.0.0.1:3000/`

部署完成后会打印后续步骤提示。

### 第 4 步：宝塔配置 Nginx 反向代理

1. 宝塔 → **网站** → **添加站点**：
   - 域名：`你的域名.com`
   - 根目录：随便（如 `/www/wwwroot/audiocenter`）
   - PHP 版本：**纯静态**（不需要 PHP）
   - 数据库：不创建

2. 进站点设置 → **反向代理** → **添加反向代理**：
   - 代理名称：`audiocenter`
   - 目标 URL：`http://127.0.0.1:3000`
   - 发送域名：`$host`
   - ✅ 启用反向代理

3. 站点设置 → **SSL** → **Let's Encrypt** → 申请免费证书 → **强制 HTTPS**

4. 访问 `https://你的域名.com` 看到前台首页，访问 `/admin` 进后台（用 .env 里的账号密码登录）。

### 第 5 步：设置开机自启

```bash
# PM2 开机自启
pm2 startup
pm2 save
```

---

## 🅱️ 方式 B：Docker Compose

宝塔软件商店 → 安装 **Docker 管理器**。

```bash
cd /www/wwwroot
git clone <你的git仓库地址> audiocenter
cd audiocenter

cp .env.example .env
vi .env   # 同样改 ADMIN_PASSWORD / NEXTAUTH_SECRET / NEXTAUTH_URL

docker compose up -d --build
```

数据持久化在 `./data/db` 和 `./data/uploads`，容器重启不丢。

宝塔 Nginx 反向代理目标改成 `http://127.0.0.1:3000` 即可（同方式 A 第 4 步）。

---

## 🆎 方式 C：纯 Node 直接跑（不推荐生产）

```bash
cd /www/wwwroot/audiocenter
npm install
npx prisma db push
npx prisma generate
npm run build
node .next/standalone/server.js
# 进程挂了就没了，建议至少用 PM2
```

---

## 🔧 常用运维命令

```bash
cd /www/wwwroot/audiocenter

# 拉取代码更新并重新部署
git pull && bash deploy.sh

# 查看进程状态
pm2 status
pm2 logs audiocenter --lines 50

# 重启 / 停止
pm2 restart audiocenter
pm2 stop audiocenter

# 重置数据库（清空所有数据，慎用！）
rm db/custom.db db/.seeded && bash deploy.sh
```

---

## 💾 备份与迁移

| 数据 | 位置 | 备份方式 |
|---|---|---|
| 数据库 | `db/custom.db` | `cp db/custom.db db/custom.db.bak` |
| 上传图片 | `public/uploads/` | `tar czf uploads.tar.gz public/uploads/` |
| 站点配置 | `.env` | 单独保存（含密钥，不要进 git） |

恢复：把备份文件拷回原位置，`pm2 restart audiocenter` 即可。

---

## 📁 目录结构说明

```
audiocenter/
├─ .env                    环境变量（含密码，不进 git）
├─ .env.example            环境变量模板
├─ deploy.sh               ★ 一键部署脚本
├─ ecosystem.config.js     PM2 进程配置
├─ Dockerfile              Docker 镜像构建
├─ docker-compose.yml      Docker 编排
├─ package.json            项目依赖与脚本
├─ next.config.ts          Next.js 配置（standalone 输出）
├─ prisma/
│  └─ schema.prisma        数据库表结构定义
├─ scripts/
│  └─ seed.ts              种子数据脚本
├─ public/
│  ├─ uploads/             运行时上传目录（用户图片，不进 git）
│  │  └─ gen/              内置示例品牌图（进 git）
│  └─ logo.svg
├─ db/
│  └─ custom.db            SQLite 数据库（不进 git）
├─ logs/                   PM2 日志（不进 git）
└─ src/                    源代码
   ├─ app/                 Next.js App Router
   │  ├─ page.tsx          首页
   │  ├─ [slug]/            动态 CMS 页面
   │  ├─ news/[slug]/        新闻详情
   │  ├─ admin/              后台
   │  └─ api/                REST API
   ├─ components/
   │  ├─ blocks/            内容块渲染器（前台后台共用）
   │  ├─ admin/              后台组件（含图片选择器）
   │  ├─ forms/              动态表单渲染
   │  └─ site/               前台头部/页脚
   └─ lib/
      ├─ auth.ts            NextAuth 配置
      ├─ db.ts               Prisma 客户端
      ├─ site.ts             站点配置缓存
      └─ blocks/types.ts     内容块类型注册表
```

---

## ❓ 常见问题

**Q: 部署后访问域名 502 Bad Gateway？**
A: PM2 进程没起。`pm2 logs audiocenter --lines 50` 看报错。常见是 .env 没改 ADMIN_PASSWORD（仍是占位符），或 NEXTAUTH_SECRET 没设。

**Q: 上传图片显示不出来？**
A: 检查 `public/uploads/` 目录权限：`chown -R www:www public/uploads`（宝塔默认 www 用户）。

**Q: 后台登录不进去？**
A: 检查 `.env` 的 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD`，注意大小写。改完 `pm2 restart audiocenter`。

**Q: 数据库想换 MySQL？**
A: 改 `prisma/schema.prisma` 的 `datasource` 为 `mysql`，`DATABASE_URL=mysql://user:pass@localhost:3306/audiocenter`，宝塔装 MySQL 后建库建用户，然后 `bash deploy.sh`。SQLite 对于单站点完全够用，迁移前可先 `cp db/custom.db` 备份。

**Q: 想要 HTTPS 强制跳转？**
A: 宝塔站点 SSL 设置里勾选「强制 HTTPS」即可，无需改代码。

---

## 🚀 快速开始（复制粘贴版）

```bash
# 1. SSH 进服务器
cd /www/wwwroot
git clone <你的git仓库地址> audiocenter && cd audiocenter

# 2. 配置环境（必改 3 项）
cp .env.example .env
sed -i "s|请改成强密码|$(openssl rand -base64 24)|" .env
sed -i "s|dev-secret-change-me.*|$(openssl rand -base64 32)|" .env
sed -i "s|http://localhost:3000|https://你的域名.com|" .env
vi .env   # 再确认下 ADMIN_USERNAME 是否要改

# 3. 一键部署
bash deploy.sh

# 4. 宝塔面板加站点 + 反代到 127.0.0.1:3000 + SSL（GUI 操作，见上文第 4 步）
```

部署完成后访问 `https://你的域名.com/admin` 用 .env 里的账号登录，开始可视化编辑你的网站内容。
