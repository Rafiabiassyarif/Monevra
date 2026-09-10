// =============================================================================
// Monevra — Konfigurasi PM2 (process manager untuk backend Node)
//
// Cara pakai (di server, dari ROOT project):
//   pm2 start deploy/ecosystem.config.cjs
//   pm2 save                 # simpan daftar proses
//   pm2 startup              # auto-start saat server reboot (ikuti instruksinya)
//
// Perintah berguna:
//   pm2 status               # lihat status
//   pm2 logs monevra         # lihat log realtime
//   pm2 restart monevra      # restart setelah update kode
//   pm2 reload monevra       # restart tanpa downtime
// =============================================================================
module.exports = {
  apps: [
    {
      name: 'monevra',
      script: 'server.js',
      cwd: './backend',              // .env dibaca dari folder ini (dotenv)
      instances: 1,                  // 1 proses (SQLite-like pool kecil); naikkan kalau perlu
      exec_mode: 'fork',             // 'cluster' kalau mau multi-core
      autorestart: true,
      watch: false,                  // produksi: JANGAN watch (boros & restart liar)
      max_memory_restart: '400M',    // restart otomatis kalau bocor memori
      env: {
        NODE_ENV: 'production',
        // PORT & kredensial lain dibaca dari backend/.env (jangan taruh rahasia di sini)
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      time: true,                    // prefix timestamp di log
    },
  ],
};
