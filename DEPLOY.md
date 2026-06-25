# Runbook Deploy — Pasang App/Subdomain Baru di Server

Server: `103.196.153.161` · Domain: `palembang-go.id` (DNS di **Hostinger**, NS `dns-parking.com`)
Reverse proxy: **Caddy** (`/etc/caddy/Caddyfile`, auto-HTTPS).

## Urutan pasang (WAJIB urut)

```
1. App jalan di port bebas        (mis. 3011 — jangan tabrakan, lihat daftar port)
2. DNS  (Hostinger)               : A record  <sub> → 103.196.153.161
                                    tunggu resolve: nslookup <sub>.palembang-go.id 8.8.8.8
3. Caddy (di server)              : ./add-site.sh <sub> <port>
4. Tes BE                         : https://<sub>.palembang-go.id/...  → harus balik data
5. FE (kalau di Vercel)           : vercel.json rewrites → domain itu → commit + push → deploy
```

> Jangan kebalik. Kalau Caddy/Vercel duluan sebelum DNS resolve, HTTPS gagal
> (Caddy butuh DNS untuk ambil sertifikat Let's Encrypt — dia auto-retry).

## `<sub>` = nama subdomain (sebelum `.palembang-go.id`)
- `api-lapaktani.palembang-go.id` → `./add-site.sh api-lapaktani 3010`
- `monev2.palembang-go.id`        → `./add-site.sh monev2 3011`

Script (`add-site.sh`) menambah blok Caddy + validate + reload. Jalankan **di server**,
sekali `chmod +x add-site.sh`. DNS A record pakai host = `<sub>`.

## Port terpakai (cek sebelum pilih port baru)
| Port | Layanan |
|------|---------|
| 3000 | api-monev |
| 3001 | marlina-api |
| 3009 | api.sidrainase |
| 3010 | Lapak Tani BE |
| 19999 | (opsional) Netdata monitoring |

Cek cepat: `sudo ss -ltnp | grep -E '300|301'`

## Vercel (FE)
- Pakai `vercel.json` rewrites → `/api/*` diteruskan ke `https://<sub>.palembang-go.id/api/*`.
  FE tetap panggil `/api` relatif → tanpa CORS, tanpa env var.
- Aktifkan **Git integration** di Vercel → tiap `git push` auto-deploy (hilangkan deploy manual).

## Troubleshoot
- `nslookup` NXDOMAIN → A record belum dibuat/propagasi (Hostinger).
- Caddy `challenge failed` di log → normal kalau DNS belum resolve; auto-sukses setelah DNS jadi.
  Cek: `sudo journalctl -u caddy -n 50 --no-pager | grep <sub>`
