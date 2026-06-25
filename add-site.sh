#!/bin/bash
# Tambah subdomain ke Caddy: ./add-site.sh <subdomain> <port>
# Contoh: ./add-site.sh api-lapaktani 3010  -> api-lapaktani.palembang-go.id -> localhost:3010
# CATATAN: tambah A record di DNS dulu, kalau tidak Caddy gagal ambil HTTPS.
set -e
CADDYFILE=/etc/caddy/Caddyfile
DOMAIN="$1.palembang-go.id"

if [ -z "$1" ] || [ -z "$2" ]; then echo "Usage: $0 <subdomain> <port>"; exit 1; fi
if grep -q "$DOMAIN {" "$CADDYFILE"; then echo "$DOMAIN sudah ada di Caddyfile, batal."; exit 1; fi

printf '\n%s {\n    reverse_proxy localhost:%s\n}\n' "$DOMAIN" "$2" | sudo tee -a "$CADDYFILE" > /dev/null
sudo caddy validate --config "$CADDYFILE"   # ponytail: validasi dulu, jangan reload config rusak
sudo systemctl reload caddy
echo "OK: $DOMAIN -> localhost:$2 (pastikan A record DNS sudah resolve untuk HTTPS)"
