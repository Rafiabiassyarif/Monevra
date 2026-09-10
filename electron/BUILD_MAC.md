# Monevra Desktop — Build & Jalankan di macOS

## Ringkasan

`electron-builder.yml` + `package.json` sudah mendukung build macOS.
Hasil build: **`.dmg`** (installer) dan **`.zip`** (arsip `.app`), untuk
**arm64** (Apple Silicon M1/M2/M3) dan **x64** (Intel).

> **PENTING:** electron-builder TIDAK bisa cross-build `.dmg` dari Windows/Linux.
> Build macOS WAJIB dijalankan di mesin Mac.

> **PENTING #2:** Repo ini meng-`.gitignore` folder `node_modules/`, `dist/`,
> `electron/vendor/`, `electron/node.exe`, dan `.env`. Artinya setelah
> `git clone`, app **BELUM bisa langsung dijalankan** — wajib jalankan setup
> dulu (langkah di bawah). Ini penyebab error "backend gagal start" /
> "Cannot find module 'express'" / "frontend/dist belum ada".

---

## Langkah di Mac mini (urut)

### 1. Prasyarat

```bash
# Node.js ≥ 20 (disarankan via Homebrew)
brew install node

# Cek
node --version      # harus ≥ v20
npm --version
```

MySQL juga harus aktif (backend connect ke DB lokal). Kalau pakai Homebrew:
```bash
brew install mysql
brew services start mysql
```

### 2. Clone repo

```bash
git clone https://github.com/Rafiabiassyarif/Monevra.git
cd Monevra
```

### 3. Jalankan SETUP (WAJIB — sekali saja setelah clone)

```bash
node scripts/setup.mjs
```

Script ini otomatis:
1. `npm install` di `backend/`, `frontend/`, `electron/`
2. Membuat `backend/.env` dari `.env.example` (+ **generate JWT_SECRET acak 64 char**)
3. `npm run build` di `frontend/` → menghasilkan `frontend/dist/`
4. Staging backend ke `electron/vendor/backend/` (termasuk `node_modules` → `_deps`)

Kalau dependency sudah terinstall sebelumnya dan hanya mau re-staging:
```bash
node scripts/setup.mjs --skip-install
```

### 4. Import database (kalau belum)

```bash
mysql -u root < backend/database/monevra.sql
```

### 5. EDIT backend/.env

Sesuaikan dengan mesin Mac (minimal DB):
```bash
nano backend/.env
```
```ini
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=          # isi kalau MySQL kamu pakai password
DB_NAME=monevra
NODE_ENV=development
JWT_SECRET=<sudah di-generate otomatis oleh setup.mjs>
```
(Catatan: kalau `backend/.env` diubah, jalankan `node scripts/setup.mjs --skip-install`
lagi supaya salinannya di `electron/vendor/backend/.env` ikut ter-update.)

### 6. Jalankan app desktop (dari source, langsung)

```bash
cd electron
npm start
```

Ini menjalankan Electron + spawn backend lokal (port 3000) + membuka window.
Kalau muncul dialog "Backend gagal start", lihat log:
```
~/Library/Application Support/Monevra/main.log
```

### 7. Build installer macOS (.dmg + .zip)

```bash
cd electron
npm run build:mac          # arm64 + x64 (dua artefak .dmg & .zip)
# atau salah satu:
npm run build:mac:arm64    # hanya Apple Silicon
npm run build:mac:x64      # hanya Intel
```

**Output** di `electron/release/`:
```
Monevra-1.0.0-arm64.dmg     # installer Apple Silicon
Monevra-1.0.0-x64.dmg       # installer Intel
Monevra-1.0.0-arm64.zip
Monevra-1.0.0-x64.zip
mac-arm64/Monevra.app       # .app final
mac-x64/Monevra.app
```

---

## Cara kerja runtime di macOS

- App menyertakan backend Express (`electron/vendor/backend`) + frontend build.
- Saat startup, backend di-spawn pakai **Node dari PATH** (`node`) — macOS/Linux
  tidak bundle `node.exe` (itu khusus Windows). Lihat `NODE_BIN` di `main.js`.
- Backend listen di **port 3000** (DESIRED_PORT); frontend di-serve same-origin.
- Log runtime: `~/Library/Application Support/Monevra/main.log`.
- App desktop tetap butuh **MySQL** aktif (backend lokal → DB lokal) — cocok untuk
  pemakaian sendiri/developer, BUKAN untuk disebar publik (belum hosting).

### Catatan tentang `NODE_ENV=production` yang di-set main.js

`main.js` menjalankan backend dengan `NODE_ENV=production`. Artinya backend
**menolak start kalau `JWT_SECRET` lemah/kosong** (fail-fast by design). Karena
itu `JWT_SECRET` di `backend/.env` **wajib** diisi (setup.mjs sudah
meng-generate otomatis).

---

## Kalau tetap error — checklist cepat

| Gejala | Penyebab | Fix |
|--------|----------|-----|
| **`spawn node ENOENT`** saat buka `.app`/`.dmg` | app dibuka dari Finder → tidak mewarisi PATH terminal; `node` Homebrew (`/opt/homebrew/bin`) tak terlihat | versi terbaru `main.js` sudah cari path absolut otomatis (`/opt/homebrew/bin/node`, `/usr/local/bin/node`, nvm). Pastikan Node terinstall: `brew install node`. Kalau masih error, jalankan app dari terminal: `/Applications/Monevra.app/Contents/MacOS/Monevra` (PATH ikut terbawa) |
| "frontend/dist belum ada" | belum build frontend | `node scripts/setup.mjs` |
| "Cannot find module 'express'" | vendor/_deps belum dibuat | `node scripts/setup.mjs` |
| "JWT_SECRET wajib di-set" | backend/.env kosong/tidak ada | cek `backend/.env`, jalankan setup |
| "Backend gagal start" (dialog) | lihat `main.log` | baca log di userData |
| Error saat `npm run build:mac` soal `node.exe` | konfigurasi lama | pastikan `node.exe` hanya di blok `win:` (sudah difix) |
| Buka `.app`/`.dmg` diblokir Gatekeeper | unsigned | klik kanan → Open, atau `xattr -cr /Applications/Monevra.app` |

### Kenapa `spawn node ENOENT` (detail)

`main.js` menjalankan backend dengan **binary Node** (`spawn(node, ['server.js'])`).
Di macOS, app yang dibuka lewat **Finder/`.dmg`** dijalankan oleh LaunchServices
dengan environment minimal — **PATH terminal tidak diwarisi**, sehingga
`/opt/homebrew/bin` (lokasi Node Homebrew) tidak terlihat → `spawn('node')` gagal
`ENOENT`.

Solusi di `main.js` (`resolveNodeBin()`): cari Node di **path absolut** yang umum
dipakai macOS, tidak bergantung PATH:

```
1. resources/node            ← kalau kamu bundle binary Node (opsional)
2. ~/.nvm/versions/node/*/bin/node   ← nvm (versi tertinggi)
3. /opt/homebrew/bin/node    ← Homebrew Apple Silicon
4. /usr/local/bin/node       ← Homebrew Intel / installer resmi nodejs.org
5. /opt/local/bin/node       ← MacPorts
6. /usr/bin/node             ← sistem
7. 'node'                    ← fallback terakhir (PATH)
```

**Cek Node kamu terinstall di mana:**
```bash
which node        # contoh: /opt/homebrew/bin/node
node --version
```

**Kalau mau app jalan TANPA Node terinstall di mesin target** (mis. dibagikan ke
orang lain): bundle binary Node ke dalam app. Unduh
`node-vXX-darwin-arm64.tar.gz` dari nodejs.org, ekstrak `bin/node` ke
`electron/node` (arm64) / `electron/node-x64`, lalu tambahkan ke `mac.extraResources`:

```yaml
mac:
  extraResources:
    - from: node            # arm64
      to: node
```
`resolveNodeBin()` akan memakai `resources/node` lebih dulu.

---

## Signing & notarization (untuk distribusi publik)

```bash
export CSC_LINK="/path/ke/DeveloperIDApp.p12"
export CSC_KEY_PASSWORD="password_p12"
export APPLE_ID="email_apple_id"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="XXXXXXX"
npm run build:mac
```
Tanpa env di atas, build tetap jalan tapi hasilnya **unsigned** (cukup untuk uji
lokal di Mac sendiri).
