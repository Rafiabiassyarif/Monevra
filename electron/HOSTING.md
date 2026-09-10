# Monevra — Mode ONLINE (hosting) vs LOKAL

## Ringkasan singkat

| | Mode LOKAL (default) | Mode ONLINE (hosting) |
|---|---|---|
| Backend | dibundel di dalam app | di server (hosting) |
| Butuh MySQL di komputer user? | **YA** | **TIDAK** |
| Butuh Node terinstall? | YA (atau Node dibundel) | TIDAK |
| Ukuran installer | besar (≈135 MB) | kecil (≈95 MB) |
| Cocok untuk | 1 orang / developer | dibagikan ke banyak orang |

**Jawaban singkat pertanyaan "kalau sudah hosting, compile-nya jadi lebih simpel?"** —
Ya. Di mode online, app desktop cuma "layar" yang memuat URL backend. Jadi di Mac
mini kamu **tidak perlu menyalakan MySQL/Laragon sama sekali**, dan compile tidak
perlu membawa backend + node_modules + binary Node.

---

## Cara app menentukan backend (urutan prioritas)

1. env `MONEVRA_URL` — override cepat (dev/uji)
2. `config.json` di folder data app — **bisa diubah tanpa rebuild**
3. konstanta build `MONEVRA_BACKEND_URL` (env saat build)
4. kalau ketiganya kosong → **mode LOKAL** (spawn backend sendiri, butuh MySQL)

File `config.json` otomatis dibuat saat app pertama dijalankan:

```
Windows : %APPDATA%\Monevra\config.json
macOS   : ~/Library/Application Support/Monevra/config.json
```

Isinya:
```json
{
  "backendUrl": "https://api.domainkamu.com",
  "_catatan": "Kosongkan untuk pakai backend lokal."
}
```
Ubah `backendUrl`, restart app, selesai — **tanpa compile ulang**.

---

## Build mode ONLINE

### macOS (di Mac mini)

```bash
cd ~/Monevra
git pull
cd electron
npm install

# build app klien (tanpa backend) yang menunjuk ke server kamu
MONEVRA_BACKEND_URL="https://api.domainkamu.com" npm run build:mac:online
```

Output di `electron/release-online/`:
```
Monevra-Online-1.0.0-arm64.dmg
Monevra-Online-1.0.0-x64.dmg
Monevra-Online-1.0.0-arm64.zip
Monevra-Online-1.0.0-x64.zip
```

**Tidak perlu** `node scripts/setup.mjs` — mode online tidak butuh backend staging.

Kalau lupa mengisi URL saat build, tidak masalah: app tetap jalan, tinggal isi
`config.json` setelahnya.

### Windows

```bash
cd electron
npm run build:online
```
(opsional: set `MONEVRA_BACKEND_URL` dulu)

---

## Build mode LOKAL (tetap tersedia)

```bash
cd electron
node ../scripts/setup.mjs      # staging backend + frontend + binary node (macOS)
npm run build                  # Windows
npm run build:mac              # macOS
```

---

## Checklist sebelum backend di-hosting

1. **Backend online** — Express + MySQL di server (VPS/hosting), akses lewat HTTPS.
2. **`backend/.env` di server**:
   - `NODE_ENV=production` (wajib — app menolak start kalau JWT_SECRET lemah)
   - `JWT_SECRET` acak ≥ 32 karakter (WAJIB, bukan default)
   - `DB_HOST/DB_USER/DB_PASSWORD/DB_NAME` sesuai server
   - **`APP_URL`** = domain backend kamu, mis. `https://api.domainkamu.com`
     (dipakai untuk whitelist CORS + redirect OAuth. Boleh beberapa, pisah koma.)
3. **Import database** di server: `mysql -u root < backend/database/monevra.sql`
4. **Frontend** — backend menyajikan `frontend/dist`, jadi build dulu di server:
   `cd frontend && npm run build`
5. **HTTPS** — pakai Nginx/Caddy reverse proxy (Electron lebih aman & lancar via HTTPS).
6. **OAuth Google/GitHub** — daftarkan `https://api.domainkamu.com/auth/callback/google`
   (dan github) di console OAuth kalian.

Setelah itu, app desktop cukup menunjuk ke `https://api.domainkamu.com` dan
**mesin user tidak perlu MySQL/Node sama sekali** — error "MySQL/Laragon" akan
hilang permanen.

---

## Verifikasi cepat (tanpa app)

Pastikan backend online bisa dijangkau:
```bash
curl -s https://api.domainkamu.com/api/health
# harap: {"ok":true}
```
Kalau `{"ok":true}` → app desktop dijamin bisa connect (asal URL sama).
Kalau tidak balas → masalahnya di server, bukan di app.
