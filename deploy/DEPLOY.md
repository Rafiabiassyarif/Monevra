# Monevra — Panduan Deploy ke Server

Panduan lengkap dari nol sampai backend online. Target: **VPS Linux (Ubuntu 22.04+)
+ Nginx + PM2 + MySQL**. Estimasi: 1–2 jam.

Setelah selesai, app desktop bisa dibuat dengan `npm run build:mac:online`
(lihat `electron/HOSTING.md`) dan **mesin user tidak perlu MySQL/Node**.

---

## 0. Ringkasan alur

```
[VPS]  MySQL  ──  Backend Node (PM2, :3001)  ──  Nginx (HTTPS 443)  ──  Internet
                        ▲                                              │
                        └──────────── app desktop (Electron) ──────────┘
```

---

## 1. Siapkan VPS

```bash
ssh user@IP_SERVER
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx mysql-server
```

**Node.js 22** (Monevra butuh Node ≥ 20):
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v      # harus v22.x
```

**PM2** (process manager):
```bash
sudo npm install -g pm2
```

---

## 2. Siapkan database

```bash
sudo mysql_secure_installation     # ikuti prompt (set root password, hapus test db)
sudo mysql -u root -p
```

Di dalam MySQL:
```sql
CREATE DATABASE monevra CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- User khusus (JANGAN pakai root untuk app)
CREATE USER 'monevra_app'@'localhost' IDENTIFIED BY 'PASSWORD_KUAT_DISINI';
GRANT ALL PRIVILEGES ON monevra.* TO 'monevra_app'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Import skema:
```bash
# dari komputer lokal (jalankan di mesin lokal):
scp backend/database/monevra.sql user@IP_SERVER:~/monevra.sql
# di server:
mysql -u monevra_app -p monevra < ~/monevra.sql
```

---

## 3. Ambil kode & install

```bash
cd ~
git clone https://github.com/Rafiabiassyarif/Monevra.git
cd Monevra

# Backend
cd backend && npm install --omit=dev && cd ..

# Frontend (backend MENYAJIKAN hasil build ini — wajib!)
cd frontend && npm install && npm run build && cd ..

# Pastikan hasil build ada:
ls frontend/dist/index.html
```

---

## 4. Konfigurasi environment

```bash
cp deploy/.env.production.example backend/.env
nano backend/.env
```

Isi **semua** placeholder. Yang paling kritis:

```ini
NODE_ENV=production          # WAJIB (mengaktifkan fail-fast & CSP)
PORT=3001
APP_URL=https://api.domainkamu.com
```

Generate JWT_SECRET yang kuat:
```bash
openssl rand -hex 48        # salin hasilnya ke JWT_SECRET
```

> **Server akan MENOLAK start** kalau `NODE_ENV=production` tapi `JWT_SECRET`
> kosong/lemah — ini pengaman, bukan bug.

---

## 5. Jalankan backend (PM2)

```bash
mkdir -p logs
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup            # jalankan perintah yang dicetak (auto-start saat reboot)
```

Cek jalan:
```bash
pm2 status
curl -s http://127.0.0.1:3001/api/health      # harap: {"ok":true}
pm2 logs monevra --lines 30
```

Kalau health gagal, lihat log — biasanya `JWT_SECRET`/DB salah (lihat bagian
Troubleshooting di bawah).

---

## 6. Nginx + HTTPS

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/monevra
sudo nano /etc/nginx/sites-available/monevra     # ganti api.domainkamu.com
sudo ln -s /etc/nginx/sites-available/monevra /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default       # hindari bentrok
sudo nginx -t                                     # uji konfigurasi
```

**Arahkan domain** ke IP server (di pengaturan DNS domainmu: A record).

Lalu pasang SSL (otomatis isi path sertifikat di nginx.conf):
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.domainkamu.com
# Certbot menawarkan redirect HTTP->HTTPS: pilih YA.
```

Reload & tes dari internet:
```bash
sudo systemctl reload nginx
curl -s https://api.domainkamu.com/api/health     # harap: {"ok":true}
```

> **Ini titik penentu.** Kalau `curl` dari luar server balas `{"ok":true}`,
> backend sudah ONLINE dan siap dipakai app desktop.

---

## 7. Checklist final sebelum dianggap selesai

- [ ] `curl https://api.domainkamu.com/api/health` → `{"ok":true}`
- [ ] `NODE_ENV=production` di `backend/.env`
- [ ] `JWT_SECRET` acak ≥ 32 char (bukan default)
- [ ] DB pakai user khusus (`monevra_app`), bukan `root`
- [ ] `APP_URL` = domain asli (CORS + redirect OAuth)
- [ ] **reCAPTCHA diganti key produksi** (key uji `6LeIxAcTA...` selalu lolos!)
- [ ] OAuth redirect URI di console Google/GitHub = `https://api.domainkamu.com/auth/callback/...`
- [ ] SMTP app password (untuk email reset password)
- [ ] Backup DB terjadwal (bagian 8)
- [ ] `pm2 save` + `pm2 startup` (auto-start saat reboot)

---

## 8. Backup database (jangan dilewatkan)

```bash
chmod +x deploy/backup-db.sh
export DB_PASSWORD='...'          # password user monevra_app
./deploy/backup-db.sh             # tes sekali
```

Jadwalkan harian (jam 2 pagi):
```bash
crontab -e
# tambahkan:
0 2 * * * DB_PASSWORD='...' /home/USER/Monevra/deploy/backup-db.sh >> /home/USER/Monevra/logs/backup.log 2>&1
```

> Backup di server yang SAMA tidak cukup kalau server mati. Salin keluar
> (rclone ke cloud / scp ke server lain) — lihat komentar di akhir `backup-db.sh`.

---

## Update aplikasi (setelah ada perubahan kode)

```bash
cd ~/Monevra
git pull
cd backend && npm install --omit=dev && cd ..
cd frontend && npm install && npm run build && cd ..
pm2 reload monevra        # restart tanpa downtime
```

---

## Troubleshooting

| Gejala | Penyebab | Fix |
|---|---|---|
| `pm2` status errored, log: "JWT_SECRET tidak valid" | secret kosong/lemah | set `JWT_SECRET` (openssl rand -hex 48) |
| **`Error: ENOENT ... stat '*/frontend/dist/index.html'`** berulang di `pm2 logs` | frontend belum di-build di server (`frontend/dist` tidak ada) | `cd frontend && npm install && npm run build` lalu `pm2 reload monevra`. Cek: `ls frontend/dist/index.html` |
| `/api/health` balas 500 | DB tidak connect | cek `DB_USER/DB_PASSWORD`, `sudo systemctl status mysql` |
| Halaman kosong / 404 di browser | `frontend/dist` belum di-build | `cd frontend && npm run build` |
| Halaman balas **503 "Frontend belum di-build"** | sama seperti di atas (pesan barunya) | `cd frontend && npm install && npm run build` → `pm2 reload monevra` |
| Login sosial gagal "redirect_uri_mismatch" | redirect URI belum didaftarkan | tambah `https://api.domainkamu.com/auth/callback/google` di console OAuth |
| App desktop bilang "tidak merespons" | URL app ≠ URL server / CORS | cek `APP_URL` di `.env` = domain app, app pakai `https` |
| CORS error di browser | `APP_URL` tidak memuat domain pemanggil | tambahkan domain ke `APP_URL` (pisah koma) |
| Error ENOENT menyebut path aneh (`~/frontend/...`) | folder project tidak lengkap — `backend/` & `frontend/` harus bersebelahan | pastikan struktur: `~/Monevra/backend/server.js` + `~/Monevra/frontend/dist/` |

---

## Alternatif: Docker (opsional)

Kalau lebih suka container, ada `deploy/Dockerfile` + `deploy/docker-compose.yml`:

```bash
cd deploy
docker compose up -d --build
docker compose logs -f monevra
```

Nginx + SSL tetap di host (atau tambahkan container nginx sendiri). Panduan
utama (non-Docker) di atas tetap jadi acuan untuk konfigurasi `.env`.
