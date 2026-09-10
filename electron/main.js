const { app, BrowserWindow, dialog, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const net = require('net');
const http = require('http');
const fs = require('fs');

// electron-updater opsional — bungkus try/catch supaya app tetap jalan walau
// module tidak ikut ter-package (devDependency / belum ada publish config).
let autoUpdater = null;
try {
  autoUpdater = require('electron-updater').autoUpdater;
} catch (e) {
  console.log('[updater] tidak tersedia:', e.message);
}

// ---------------------------------------------------------------------------
// Monevra Desktop — main process
//
// Arsitektur: app desktop adalah KLIEN ke backend.
//  - Mode PRODUKSI (default): spawn backend Express lokal (node server.js)
//    dari folder backend/ Monevra, lalu window load dari http://localhost:PORT.
//    Backend itu sendiri yang menyajikan frontend build (frontend/dist).
//  - Mode DEV: set env MONEVRA_URL=http://localhost:3000 (vite) untuk
//    development hot-reload — backend/vite dijalankan manual dari terminal.
//
// Nanti saat backend online: tinggal set MONEVRA_URL=https://api.domain.com
// (atau masukkan ke konfigurasi) — app jadi klien ke server, tanpa spawn lokal.
// ---------------------------------------------------------------------------

const IS_DEV = !!process.env.MONEVRA_URL;
const isPackaged = app.isPackaged;

// Resolve lokasi backend & frontend-build.
//  - Saat DEV (electron .): relatif ke folder electron/  (backend/, frontend/dist di root project)
//  - Saat PACKAGED: backend & frontend/dist disalin ke process.resourcesPath via extraResources
const APP_ROOT = isPackaged
  ? path.join(process.resourcesPath)
  : path.join(__dirname, '..');

// Saat packaged: electron-builder mengecualikan folder bernama "node_modules" dari
// extraResources. Solusi: di staging dependency dinamai "_deps". Saat runtime,
// backend di-copy ke userData (writable) & _deps di-rename jadi node_modules.
const BACKEND_RESOURCES_DIR = path.join(APP_ROOT, 'backend');
// CATATAN: jangan panggil app.getPath di module scope — dihitung saat fungsi jalan
// (app sudah ready), karena getPath bisa gagal sebelum ready di beberapa versi.
let BACKEND_RUNTIME_DIR = null;

function prepareBackendRuntime() {
  if (!isPackaged) return BACKEND_RESOURCES_DIR;
  if (!BACKEND_RUNTIME_DIR) {
    BACKEND_RUNTIME_DIR = path.join(app.getPath('userData'), 'backend-runtime');
  }
  const fsx = require('fs');
  const src = BACKEND_RESOURCES_DIR;
  const dest = BACKEND_RUNTIME_DIR;
  const depsSrc = path.join(src, '_deps');
  const depsDest = path.join(dest, 'node_modules');

  // Cek apakah sudah siap (hindari copy ulang tiap start)
  if (fsx.existsSync(path.join(dest, 'server.js')) && fsx.existsSync(depsDest)) {
    return dest;
  }

  // Copy backend (kecuali _deps dulu)
  fsx.rmSync(dest, { recursive: true, force: true });
  fsx.mkdirSync(dest, { recursive: true });
  const { cpSync } = fsx;
  for (const entry of fsx.readdirSync(src)) {
    if (entry === '_deps') continue;
    cpSync(path.join(src, entry), path.join(dest, entry), { recursive: true });
  }
  // Copy dependency + rename _deps -> node_modules
  cpSync(depsSrc, depsDest, { recursive: true });

  // server.js resolve frontend dist via path.join(__dirname, '../frontend/dist').
  // Karena backend di-copy ke userData/backend-runtime, ../frontend = userData/frontend.
  // Copy frontend build ke userData/frontend/dist supaya path tersebut valid.
  const srcFrontend = path.join(APP_ROOT, 'frontend', 'dist');
  const destFrontend = path.join(app.getPath('userData'), 'frontend', 'dist');
  if (fsx.existsSync(srcFrontend)) {
    fsx.rmSync(path.join(app.getPath('userData'), 'frontend'), { recursive: true, force: true });
    cpSync(srcFrontend, destFrontend, { recursive: true });
  }
  return dest;
}

// Node runtime untuk spawn backend.
//  - Windows packaged: node.exe di-bundle via extraResources (ABI cocok utk native modules)
//  - macOS/Linux packaged: andalkan node dari PATH (user/CI harus install Node — sama spt dev)
//  - Override eksplisit via env MONEVRA_NODE (dev)
const NODE_BIN =
  process.env.MONEVRA_NODE || // eksplisit (dev)
  (isPackaged && process.platform === 'win32'
    ? path.join(process.resourcesPath, 'node.exe') // node di-bundle via extraResources
    : 'node'); // non-Windows packaged & semua dev: andalkan PATH

const DESIRED_PORT = 3000; // port dev yang terdaftar di OAuth Google/GitHub (redirect_uri konsisten dgn web)
let backendProcess = null;
let mainWindow = null;

// --- logging ke file (berguna utk debug app packaged) ---------------------------
function log(msg) {
  try {
    const dir = app.getPath('userData');
    fs.appendFileSync(path.join(dir, 'main.log'), `[${new Date().toISOString()}] ${msg}\n`);
  } catch {}
  console.log(msg);
}

// --- utilitas: cari port bebas -------------------------------------------------
function getFreePort(start) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => resolve(getFreePort(start + 1)));
    server.listen(start, '127.0.0.1', () => {
      const addr = server.address();
      server.close(() => resolve(addr.port));
    });
  });
}

// --- utilitas: tunggu backend siap (health check) ------------------------------
function waitForBackend(url, timeoutMs = 20000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const req = http.get(url, { timeout: 2000 }, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) return resolve(true);
        retry();
      });
      req.on('error', retry);
      req.on('timeout', () => { req.destroy(); retry(); });
    };
    const retry = () => {
      if (Date.now() - started > timeoutMs) return reject(new Error('Backend tidak merespons dalam ' + (timeoutMs/1000) + ' detik.'));
      setTimeout(tryOnce, 500);
    };
    tryOnce();
  });
}

// --- spawn backend Express (mode produksi lokal) -------------------------------
async function startLocalBackend() {
  log('startLocalBackend: memilih port...');
  const port = await getFreePort(DESIRED_PORT);
  const backendUrl = `http://localhost:${port}`;
  log('startLocalBackend: port ' + port);

  // Pastikan frontend sudah di-build (dist ada)
  const distPath = path.join(APP_ROOT, 'frontend', 'dist', 'index.html');
  if (!fs.existsSync(distPath)) {
    throw new Error('frontend/dist belum ada. Jalankan "npm run build" di folder frontend/ dulu.');
  }

  // Siapkan backend runtime (copy ke userData + rename _deps -> node_modules saat packaged)
  log('startLocalBackend: menyiapkan backend runtime...');
  const backendDir = prepareBackendRuntime();
  log('startLocalBackend: backendDir=' + backendDir);
  log('startLocalBackend: spawn node=' + NODE_BIN);

  backendProcess = spawn(NODE_BIN, ['server.js'], {
    cwd: backendDir,
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: 'production',
      // Origin app = localhost:port ini (frontend di-serve backend, same-origin)
      APP_URL: `http://localhost:${port}`,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  // Tangkap error spawn (mis. NODE_BIN tidak ditemukan) — jangan pakai throw di
  // event handler (tidak tertangkap try/catch, jadi uncaught). Tolak promise-nya.
  const spawnError = new Promise((_, reject) => {
    backendProcess.on('error', (err) => {
      log('startLocalBackend: ERROR spawn node: ' + err.message);
      reject(new Error(
        `Gagal menjalankan backend: ${err.message}. ` +
        (process.platform !== 'win32'
          ? 'Pastikan Node.js terinstall dan tersedia di PATH (jalankan `node --version`).'
          : 'Pastikan file node.exe tersedia (masuk via electron/node.exe).')
      ));
    });
  });

  // Backend keluar SEBELUM health check sukses = error nyata (mis. JWT_SECRET
  // kosong di produksi, port bentrok, dsb). Tangkap, jangan hang di waitForBackend.
  const exitedEarly = new Promise((_, reject) => {
    backendProcess.on('exit', (code) => {
      log('[backend] exited with code ' + code);
      backendProcess = null;
      reject(new Error(
        `Backend berhenti (exit code ${code}). Lihat log di atas untuk detail. ` +
        (process.platform !== 'win32' && code !== 0
          ? 'Kemungkinan JWT_SECRET/DB tidak terkonfigurasi di backend/.env.'
          : '')
      ));
    });
  });

  backendProcess.stdout.on('data', (d) => log('[backend] ' + d.toString().trim()));
  backendProcess.stderr.on('data', (d) => log('[backend-err] ' + d.toString().trim()));

  // Ambil salah satu yang terjadi lebih dulu: backend siap (health 200) / spawn error / exit dini
  const ready = waitForBackend(backendUrl + '/api/health');
  ready.catch(() => {}); // hindari unhandled rejection kalau spawnError/exitedEarly menang duluan
  await Promise.race([ready, spawnError, exitedEarly]);
  return backendUrl;
}

// --- jendela utama --------------------------------------------------------------
async function createWindow() {
  let url;
  if (IS_DEV) {
    url = process.env.MONEVRA_URL;
  } else {
    try {
      url = await startLocalBackend();
    } catch (err) {
      log('ERROR start backend: ' + (err && err.stack || err));
      dialog.showErrorBox(
        'Monevra — Backend gagal start',
        `${err.message}\n\nPastikan:\n1. MySQL/Laragon sedang berjalan\n2. Frontend sudah di-build (npm run build di frontend/)\n3. Node.js tersedia`
      );
      app.quit();
      return;
    }
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 480,
    minHeight: 600,
    title: 'Monevra – Manajemen Keuangan Pribadi',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Link eksternal (bukan localhost) → buka di browser default, jangan di dalam app
  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    if (targetUrl.startsWith('http://localhost') || targetUrl.startsWith('http://127.0.0.1')) {
      return { action: 'allow' };
    }
    shell.openExternal(targetUrl);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
  await mainWindow.loadURL(url);
}

// --- auto-update (hanya aktif saat packaged, updater tersedia, & ada publish) ---
function setupAutoUpdate() {
  if (!app.isPackaged) return; // dev: jangan cek update
  if (!autoUpdater) return; // electron-updater tidak ter-package
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('error', (err) => {
    console.log('[updater] error (diabaikan):', err.message);
  });
  autoUpdater.on('update-available', () => {
    console.log('[updater] update tersedia, mengunduh...');
  });
  autoUpdater.on('update-not-available', () => {
    console.log('[updater] sudah versi terbaru');
  });
  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Pembaruan Monevra',
      message: 'Versi baru Monevra telah diunduh.',
      detail: 'Aplikasi akan diperbarui dan dimulai ulang.',
      buttons: ['Mulai Ulang Sekarang', 'Nanti'],
      defaultId: 0,
      cancelId: 1,
    }).then(({ response }) => {
      if (response === 0) autoUpdater.quitAndInstall();
    });
  });

  // Cek update di latar belakang (tidak mengganggu startup)
  setTimeout(() => {
    try {
      autoUpdater.checkForUpdates();
    } catch (e) {
      console.log('[updater] cek gagal (diabaikan):', e.message);
    }
  }, 5000);
}

// --- single instance lock ---------------------------------------------------------
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    setupAutoUpdate();
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('window-all-closed', () => {
  if (backendProcess) { try { backendProcess.kill(); } catch {} }
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (backendProcess) { try { backendProcess.kill(); } catch {} }
});
