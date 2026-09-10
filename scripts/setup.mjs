#!/usr/bin/env node
/**
 * Monevra — Setup build/run (Windows / macOS / Linux)
 *
 * Menyiapkan SEMUA yang dibutuhkan app Electron & backend, karena beberapa
 * folder penting sengaja di-.gitignore (node_modules, dist, vendor, .env) dan
 * TIDAK ikut saat `git clone`. Jalankan sekali setelah clone (dan tiap kali
 * dependency berubah).
 *
 * Yang dilakukan:
 *   1. npm install di backend/ , frontend/ , electron/
 *   2. Bikin backend/.env dari backend/.env.example kalau belum ada
 *      (+ generate JWT_SECRET acak 64 char — WAJIB utk mode production)
 *   3. npm run build di frontend/  -> frontend/dist
 *   4. Staging backend ke electron/vendor/backend/ :
 *        - salin semua file backend (kecuali node_modules)
 *        - salin node_modules -> vendor/backend/_deps
 *      (electron-builder mengecualikan folder bernama "node_modules",
 *       makanya dinamai "_deps" dan di-rename balik saat runtime)
 *   5. macOS: salin binary Node ke electron/node supaya ikut ter-bundle —
 *      app yang dibuka dari Finder tidak mewarisi PATH (spawn ENOENT).
 *
 * Pakai:
 *   node scripts/setup.mjs            # setup lengkap
 *   node scripts/setup.mjs --skip-install   # lewati npm install (cepat)
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';
const skipInstall = process.argv.includes('--skip-install');

const log = (m) => console.log(`\x1b[36m[setup]\x1b[0m ${m}`);
const ok = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const warn = (m) => console.log(`  \x1b[33m!\x1b[0m ${m}`);

function run(cmd, args, cwd) {
  log(`$ ${cmd} ${args.join(' ')}  (cwd: ${path.relative(ROOT, cwd) || '.'})`);
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: isWindows });
  if (r.status !== 0) {
    console.error(`\x1b[31m[setup] GAGAL: ${cmd} ${args.join(' ')}\x1b[0m`);
    process.exit(r.status || 1);
  }
}

function copyDir(src, dest, filter) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (filter && !filter(entry.name)) continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d, filter);
    else if (entry.isFile() || entry.isSymbolicLink()) fs.copyFileSync(s, d);
  }
}

// --- 1. Install dependency -------------------------------------------------
const backendDir = path.join(ROOT, 'backend');
const frontendDir = path.join(ROOT, 'frontend');
const electronDir = path.join(ROOT, 'electron');

if (!skipInstall) {
  log('1/5 Install dependency (ini butuh internet, agak lama)...');
  run('npm', ['install'], backendDir);
  run('npm', ['install'], frontendDir);
  run('npm', ['install'], electronDir);
  ok('dependency terinstall');
} else {
  log('1/5 Install dependency — DILEWATI (--skip-install)');
}

// --- 2. backend/.env -------------------------------------------------------
log('2/5 Siapkan backend/.env...');
const envPath = path.join(backendDir, '.env');
const envExample = path.join(backendDir, '.env.example');
if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExample)) {
    let content = fs.readFileSync(envExample, 'utf8');
    // Ganti placeholder JWT_SECRET dgn nilai acak 64 char (wajib utk production)
    const secret = crypto.randomBytes(48).toString('hex'); // 96 char hex
    content = content.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${secret}`);
    content = content.replace(/^NODE_ENV=.*$/m, 'NODE_ENV=development');
    fs.writeFileSync(envPath, content);
    ok('backend/.env dibuat dari .env.example (JWT_SECRET di-generate acak)');
    warn('EDIT backend/.env: isi DB_USER/DB_PASSWORD, GEMINI_API_KEY, OAuth, SMTP sesuai mesin ini');
  } else {
    warn('backend/.env.example tidak ada — lewati pembuatan .env');
  }
} else {
  ok('backend/.env sudah ada (tidak diubah)');
}

// --- 3. Build frontend -----------------------------------------------------
log('3/5 Build frontend (vite) -> frontend/dist ...');
run('npm', ['run', 'build'], frontendDir);
ok('frontend/dist siap');

// --- 4. Staging backend ke electron/vendor/backend -------------------------
log('4/5 Staging backend -> electron/vendor/backend ...');
const vendorBackend = path.join(electronDir, 'vendor', 'backend');
fs.rmSync(path.join(electronDir, 'vendor'), { recursive: true, force: true });
copyDir(backendDir, vendorBackend, (name) => name !== 'node_modules');

const depsSrc = path.join(backendDir, 'node_modules');
const depsDest = path.join(vendorBackend, '_deps');
if (fs.existsSync(depsSrc)) {
  copyDir(depsSrc, depsDest);
  ok('backend/node_modules -> vendor/backend/_deps');
} else {
  warn('backend/node_modules tidak ada — jalankan tanpa --skip-install');
}

ok('staging selesai: ' + path.relative(ROOT, vendorBackend));

// --- 5. macOS: bundle binary Node -----------------------------------------
// App yang di-launch dari Finder/.dmg TIDAK mewarisi PATH terminal → spawn('node')
// = ENOENT. Solusi: salin binary Node ke electron/node-<arch>, lalu electron-builder
// membundelnya ke resources/node (lihat mac.extraResources, pakai makro ${arch}).
if (process.platform === 'darwin') {
  log('5/5 macOS: siapkan binary Node utk di-bundle...');
  const arch = process.arch; // 'arm64' | 'x64'
  const nodeSrc = process.execPath; // binary node yang menjalankan script ini
  const nodeDest = path.join(electronDir, `node-${arch}`);
  try {
    fs.copyFileSync(nodeSrc, nodeDest);
    fs.chmodSync(nodeDest, 0o755);
    ok(`Node (${arch}) di-bundle: ${path.relative(ROOT, nodeDest)}`);
    if (arch === 'arm64') {
      warn('build x64 di mesin arm64: siapkan node-x64 terpisah (atau build di mesin Intel)');
    }
  } catch (e) {
    warn(`gagal menyalin Node (${e.message}). App fallback ke Node dari PATH.`);
  }
} else {
  log('5/5 macOS: bundle Node — DILEWATI (bukan macOS)');
}

console.log(`
\x1b[32m╔══════════════════════════════════════════════════════╗
║  Setup selesai!                                      ║
╚══════════════════════════════════════════════════════╝\x1b[0m

Jalankan app desktop (dev, langsung dari source):
  cd electron && npm start

Build installer:
  cd electron && npm run build        # Windows (.exe NSIS)
  cd electron && npm run build:mac    # macOS (.dmg + .zip)

Pastikan MySQL aktif & database 'monevra' sudah di-import:
  mysql -u root < backend/database/monevra.sql
`);
