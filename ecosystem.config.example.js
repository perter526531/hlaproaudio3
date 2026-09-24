// ───────────────────────────────────────────────────────────
// PM2 进程守护配置 —— 模板（复制为 ecosystem.config.js 后按需修改）
//
// 用法：
//   cp ecosystem.config.example.js ecosystem.config.js
//   pm2 start ecosystem.config.js && pm2 save
//
// 本文件会自动加载同目录 .env 的所有环境变量注入到进程，
// 所以你只需维护 .env 即可，无需在这里硬编码密码/密钥。
//
// 注意：ecosystem.config.js 已加入 .gitignore，你的自定义版本不会被 git 覆盖。
// ───────────────────────────────────────────────────────────
/* eslint-disable @typescript-eslint/no-require-imports */

// 内联 .env 解析器（无外部依赖，避免 PM2 env_file 在某些版本下不稳定）
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].replace(/^["']|["']$/g, '').trim();
    // 不覆盖已存在的系统环境变量（让 PM2 命令行 / shell export 优先）
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

module.exports = {
  apps: [
    {
      name: 'audiocenter',
      script: '.next/standalone/server.js',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
        HOSTNAME: '0.0.0.0',
        PORT: 3000,
        // 把 .env 读到的所有变量透传给应用
        DATABASE_URL: process.env.DATABASE_URL,
        ADMIN_USERNAME: process.env.ADMIN_USERNAME,
        ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      },
      instances: 1,                 // SQLite 单写，不建议多实例
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      watch: false,
      max_memory_restart: '512M',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      merge_logs: true,
      time: true,
    },
  ],
};
