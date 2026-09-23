// ───────────────────────────────────────────────────────────
// PM2 进程守护配置 —— AudioCenter CMS
// 用法：pm2 start ecosystem.config.js && pm2 save
// ───────────────────────────────────────────────────────────
module.exports = {
  apps: [
    {
      name: 'audiocenter',
      // 生产环境用 Next.js standalone 产物（Node 即可，无需 bun）
      script: '.next/standalone/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // 数据库与密钥从 .env 或系统环境变量读取；这里只兜底
      },
      env_file: '.env',
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
