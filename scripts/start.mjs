import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const isWindows = process.platform === 'win32';

// Preflight: backend menyajikan build React dari frontend/dist (folder ini TIDAK
// ada di git). Tanpa build, halaman web tidak terbuka — ingatkan di awal, jangan
// biarkan user menemukannya sendiri lewat error ENOENT berulang di log.
const frontendIndex = path.resolve('frontend', 'dist', 'index.html');
if (!fs.existsSync(frontendIndex)) {
  console.warn(
    '\x1b[33m⚠️  [MONEVRA] frontend/dist belum di-build — halaman web tidak akan terbuka.\n' +
    '   Perbaiki:  cd frontend && npm install && npm run build\n' +
    '   Endpoint /api/* tetap berfungsi.\x1b[0m'
  );
}

// Tentukan path ke python executable di dalam virtual environment
const pythonExecutable = path.resolve(
  isWindows 
    ? path.join('.venv', 'Scripts', 'python.exe')
    : path.join('.venv', 'bin', 'python')
);

const processes = [
  // 1. Jalankan Node.js backend
  spawn('node', ['backend/server.js'], { stdio: 'inherit', shell: isWindows }),
];

// Python OCR Server telah diganti dengan Gemini AI
// Tidak perlu lagi menjalankan server.py

const shutdown = () => {
  console.log('\n\x1b[31m🛑 [MONEVRA] Mematikan semua server...\x1b[0m');
  for (const child of processes) {
    if (!child.killed) child.kill();
  }
};

process.on('SIGINT', () => {
  shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  shutdown();
  process.exit(0);
});

for (const child of processes) {
  child.on('exit', code => {
    if (code && code !== 0) {
      console.error(`\n\x1b[31m❌ [MONEVRA] Salah satu server crash dengan kode ${code}. Mematikan semua server.\x1b[0m`);
      shutdown();
      process.exit(code);
    }
  });
}
