#!/usr/bin/env bash
# =============================================================================
# Monevra — Backup database MySQL harian (+ retensi 14 hari)
#
# Cara pakai:
#   chmod +x deploy/backup-db.sh
#   ./deploy/backup-db.sh                       # backup sekali
#   # lalu jadwalkan harian via cron:
#   # crontab -e  →  0 2 * * * /home/USER/Monevra/deploy/backup-db.sh >> /home/USER/Monevra/logs/backup.log 2>&1
# =============================================================================
set -euo pipefail

# ---- Konfigurasi (sesuaikan / ambil dari environment) ------------------------
DB_NAME="${DB_NAME:-monevra}"
DB_USER="${DB_USER:-monevra_app}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
# DB_PASSWORD wajib di-export dari luar (jangan ditulis di file ini):
#   export DB_PASSWORD='...'   atau lewat cron environment

BACKUP_DIR="${BACKUP_DIR:-$HOME/monevra-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y-%m-%d_%H%M%S)"
FILE="$BACKUP_DIR/${DB_NAME}_${STAMP}.sql.gz"

echo "[$(date '+%F %T')] Mulai backup $DB_NAME -> $FILE"

# mysqldump dgn password via env MYSQL_PWD (tidak muncul di daftar proses)
MYSQL_PWD="${DB_PASSWORD:-}" mysqldump \
  -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" \
  --single-transaction --quick --routines --events \
  "$DB_NAME" | gzip -9 > "$FILE"

SIZE="$(du -h "$FILE" | cut -f1)"
echo "[$(date '+%F %T')] Backup selesai ($SIZE)"

# ---- Hapus backup lebih tua dari RETENTION_DAYS -------------------------------
DELETED="$(find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -type f -mtime +"$RETENTION_DAYS" -print -delete | wc -l)"
echo "[$(date '+%F %T')] Retensi: $DELETED file lama dihapus (> ${RETENTION_DAYS} hari)"

# ---- (Opsional) Kirim ke penyimpanan lain ------------------------------------
# Backup di server SAMA tidak cukup kalau server mati. Salin keluar, mis.:
#   rclone copy "$FILE" remote:monevra-backup/     # Google Drive/S3 via rclone
#   scp "$FILE" user@backup-host:/backups/
