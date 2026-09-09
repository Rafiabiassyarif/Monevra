# Monevra Desktop — Build macOS

## Ringkasan

Konfigurasi `electron-builder.yml` + `package.json` sudah mendukung build macOS.
Hasil build: **`.dmg`** (installer drag-and-drop) dan **`.zip`** (arsip .app),
untuk dua arsitektur: **arm64** (Apple Silicon M1/M2/M3) dan **x64** (Intel).

> **PENTING:** electron-builder TIDAK bisa cross-build `.dmg` dari Windows/Linux.
> Build macOS WAJIB dijalankan di mesin Mac (seperti Mac mini kamu).

## Prasyarat di Mac mini

1. **Node.js LTS** (≥ 18, disarankan ≥ 20) — via `brew install node` atau installer dari nodejs.org.
2. **npm** (ikut terinstall bersama Node).
3. **git** (clone repo) — biasanya sudah ada via Xcode Command Line Tools.
4. **CocoaPods** (HANYA dibutuhkan kalau ada native module — app ini tidak, jadi bisa dilewati).
5. **Xcode Command Line Tools** (untuk signing/toolchain): `xcode-select --install`.
   - Untuk distribusi publik butuh juga **Apple Developer account** + sertifikat signing
     (lihat bagian Signing di bawah). Untuk build lokal/pribadi, bisa `CSC_IDENTITY_AUTO_DISCOVERY=false`.

## Clone & install

```bash
git clone https://github.com/Rafiabiassyarif/Monevra.git
cd Monevra

# Build frontend (dist) + install dependency electron
cd electron
npm install
```

> Backend yang di-bundle ada di `electron/vendor/backend/` (sudah berisi `_deps` → akan
> di-rename jadi `node_modules` saat runtime). Pastikan folder itu ikut ter-clone.
> Kalau `vendor/backend/_deps` kosong setelah clone (masuk .gitignore), jalankan:
> ```bash
> cd ../backend && npm install --omit=dev
> # lalu staging ulang:
> cp -r node_modules ../electron/vendor/backend/_deps
> ```

## Menjalankan build macOS

Dari folder `electron/`:

```bash
# Build DMG + ZIP untuk arm64 DAN x64 (dua artefak)
npm run build:mac

# Hanya arm64 (Apple Silicon — semua Mac mini M1/M2/M3)
npm run build:mac:arm64

# Hanya x64 (Mac Intel)
npm run build:mac:x64

# Build ulang tanpa rebuild frontend (kalau cuma ubah kode electron)
npm run dist:mac
```

### Output

Hasil build ada di `electron/release/`:

```
release/
  Monevra-1.0.0-arm64.dmg     # installer untuk Apple Silicon
  Monevra-1.0.0-x64.dmg       # installer untuk Mac Intel
  Monevra-1.0.0-arm64.zip     # arsip .app untuk Apple Silicon
  Monevra-1.0.0-x64.zip       # arsip .app untuk Mac Intel
  mac-arm64/                  # folder build staging (.app)
  mac-x64/
```

`.app` final juga tersedia di dalam folder build:
`release/mac-arm64/Monevra.app` / `release/mac-x64/Monevra.app`

## Signing & notarization (untuk distribusi publik)

Agar `.dmg` bisa dibuka tanpa peringatan "app is damaged"/"unidentified developer",
perlu **signing + notarization** oleh Apple:

1. **Developer ID Application** cert — buat di https://developer.apple.com/account.
2. Set env di mesin build:
   ```bash
   export CSC_LINK="/path/ke/DeveloperIDApp.p12"
   export CSC_KEY_PASSWORD="password_p12"
   export APPLE_ID="email_apple_id"
   export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"  # app-specific password
   export APPLE_TEAM_ID="XXXXXXX"
   ```
3. Jalankan `npm run build:mac` — electron-builder otomatis sign + notarize.

Tanpa env di atas, build tetap JALAN tapi hasilnya **unsigned** — cukup untuk uji lokal
di Mac kamu sendiri (klik kanan → Open, atau `xattr -cr Monevra.app` jika diblokir Gatekeeper).

## Cara kerja runtime di macOS (untuk konteks)

- App menyertakan backend Express (di `vendor/backend`) + frontend build.
- Saat startup, backend di-copy ke folder userData lalu di-spawn menggunakan **Node dari PATH**
  (`node`) — macOS/Linux tidak bundle `node.exe` (itu khusus Windows). NODE_BIN di `main.js`
  sudah platform-aware.
- Backend listen di **port 3000** (DESIRED_PORT), frontend di-serve same-origin.
- Log runtime tersimpan di `~/Library/Application Support/Monevra/main.log`.
- App desktop tetap membutuhkan **MySQL** aktif di mesin (backend lokal connect DB lokal) —
  cocok untuk pemakaian sendiri/developer.