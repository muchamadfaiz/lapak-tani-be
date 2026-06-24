# Load test (k6)

Tes performa & rate-limit API pakai [k6](https://k6.io), dengan **verdict pass/fail per endpoint**.

## Install k6 (sekali)

```powershell
winget install k6 --source winget   # Windows
# brew install k6                    # macOS
```

## Jalankan

```bash
# Default: target 127.0.0.1:3000, puncak 50 VU, semua endpoint inti
k6 run test/load/api-load.js

# Arahkan ke server lain
k6 run -e BASE_URL=http://103.196.153.161:3010/api test/load/api-load.js

# Beban lebih besar
k6 run -e PEAK_VUS=100 test/load/api-load.js
```

### Dengan laporan grafik (HTML)

```bash
K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=test/load/report.html \
  k6 run -e BASE_URL=http://103.196.153.161:3010/api test/load/api-load.js
```
Buka `test/load/report.html` di browser — grafik latency, VUs, throughput. Live dashboard juga ada di `http://127.0.0.1:5665` selama run.

## Parameter (env, semua opsional)

| Env | Default | Keterangan |
|-----|---------|------------|
| `BASE_URL` | `http://127.0.0.1:3000/api` | Pakai `127.0.0.1`, **bukan** `localhost` (Windows: `localhost`→IPv6 +~200ms/request) |
| `EMAIL` / `PASSWORD` | `admin@example.com` / `admin123` | Kredensial login (seed admin) |
| `PEAK_VUS` | `50` | Puncak virtual user |

Daftar endpoint yang diuji ada di array `ENDPOINTS` dalam `api-load.js` — tinggal tambah/kurangi.

## Cara baca laporan (untuk klien)

Ringkasan k6 menampilkan **satu baris per endpoint**, langsung ✓/✗:
```
✓ http_req_duration{name:GET /ipals/map,expected_response:true} p(95)=47ms
✓ http_req_duration{name:GET /surveys,expected_response:true}   p(95)=52ms
✗ http_req_duration{name:GET /users,expected_response:true}     p(95)=820ms   <- perlu perhatian
```

- **p95 / p99 per endpoint** → patokan: p95 < 500ms, p99 < 1000ms (kondisi pengalaman terburuk, bukan rata-rata).
- **`checks` > 99%** → hampir semua request balas 200.
- **`http_req_failed` < 1%** → tingkat error.

## ⚠️ Agar angka jujur (WAJIB sebelum simpulkan)

1. **Naikkan throttle dulu.** Default 120 req/menit → beban tinggi dibalas `429` dan threshold `http_req_failed` akan merah. Set `THROTTLE_LIMIT=1000000` di `.env` server, restart, lalu jalankan.
2. **Ukur di build produksi**, bukan dev server:
   ```bash
   pnpm build && node dist/src/main
   ```
   `start:dev` pakai `pino-pretty` yang melambat saat dibebani → angka menyesatkan (p95 bisa membengkak walau server sehat).
3. **Pakai `127.0.0.1`**, bukan `localhost` (Windows).

> Catatan: `report.html` adalah artefak hasil run (berubah tiap kali) — sudah di-ignore git, jangan di-commit.
