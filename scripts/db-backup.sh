#!/usr/bin/env bash
# Sao lưu database ra file .sql.gz. Cần cài pg_dump (postgresql-client).
# Dùng: DATABASE_URL=... npm run db:backup [-- thư-mục-đích]
set -euo pipefail

: "${DATABASE_URL:?Thiếu DATABASE_URL}"
DEST="${1:-backups}"
mkdir -p "$DEST"
FILE="$DEST/banh-mi-thanh-long-$(date -u +%Y%m%d-%H%M%S).sql.gz"

pg_dump --no-owner --no-privileges "$DATABASE_URL" | gzip > "$FILE"
echo "Đã sao lưu: $FILE"
