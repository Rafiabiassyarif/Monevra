import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const isWindows = process.platform === 'win32';

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
