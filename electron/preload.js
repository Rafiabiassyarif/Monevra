// Monevra Desktop — preload script
// Menjembatani API native (via contextBridge) ke halaman web dengan aman.
// Halaman tetap sandbox (nodeIntegration=false, contextIsolation=true).

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('monevraDesktop', {
  // Versi app — bisa ditampilkan di UI "Tentang"
  appVersion: process.env.npm_package_version || '1.0.0',
  platform: process.platform,

  // Info backend yang sedang dipakai (untuk debugging / halaman status)
  getBackendInfo: () => ({
    isDesktop: true,
    platform: process.platform,
  }),
});
