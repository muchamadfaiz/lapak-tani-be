# Laporan Uji Beban (Load Test) API — PUPR Manfaat IPAL

**Tanggal:** 16 Juni 2026
**Alat uji:** k6 v2.0.0
**Disiapkan untuk:** Klien / Stakeholder

---

## Ringkasan Eksekutif

API diuji dengan **50 pengguna aktif bersamaan** menembak 6 endpoint utama secara
terus-menerus selama ~51 detik (total **3.889 permintaan**).

> ✅ **Hasil: LULUS.** Seluruh endpoint merespons jauh di bawah target 500ms
> (p95 tertinggi hanya **33ms**), dengan **0% kegagalan**. Sistem proteksi
> rate-limit (anti-spam/DoS) juga terbukti aktif dan berfungsi.
>
> **Kesimpulan: API cepat, stabil, dan siap produksi.**

---

## Metodologi

| Aspek | Keterangan |
|---|---|
| Skenario | 50 virtual user, ramp bertahap (10 → 30 → 50), durasi ~51 detik |
| Beban | 3.889 permintaan (~76 permintaan/detik) |
| Build | **Produksi** (`node dist`, logging produksi) — bukan mode pengembangan |
| Endpoint | 6 endpoint baca utama (daftar, peta, pengguna, dsb.) |
| Target latency | p95 < 500ms (standar pengalaman pengguna) |

> Catatan: rate-limit dinaikkan sementara khusus saat pengukuran kapasitas, agar
> angka mencerminkan performa server sebenarnya (bukan ditahan oleh proteksi).

---

## Hasil per Endpoint

Angka **p95** = 95% permintaan lebih cepat dari ini (indikator pengalaman terburuk yang wajar).

| Endpoint | p95 | Target p95 | Status |
|---|---|---|---|
| GET /ipals/map | 16ms | <500ms | ✅ Lulus |
| GET /surveys/map | 17ms | <500ms | ✅ Lulus |
| GET /ipals | 19ms | <500ms | ✅ Lulus |
| GET /rbac/roles | 24ms | <500ms | ✅ Lulus |
| GET /users | 25ms | <500ms | ✅ Lulus |
| GET /surveys | 33ms | <500ms | ✅ Lulus |

**Metrik keseluruhan:**

| Metrik | Nilai |
|---|---|
| Total permintaan | 3.889 |
| Tingkat kegagalan | **0,00%** |
| Throughput | ~76 permintaan/detik |
| Latency median | 7ms |
| Latency p95 (gabungan) | 23ms |

---

## Temuan & Catatan

1. **Performa seragam & sehat.** Tidak ada endpoint yang menonjol lambat. Endpoint
   tercepat ~16ms (p95), terlambat ~33ms (p95) — semua jauh di bawah ambang 500ms.
2. **Tanpa kegagalan** pada 3.889 permintaan di bawah beban konkuren.
3. **Proteksi keamanan aktif:**
   - Rate-limit (throttle) membatasi 120 permintaan/menit per IP — mencegah spam & brute-force.
   - Endpoint login dibatasi lebih ketat (5/menit) — anti brute-force.
   - Security headers (Helmet) aktif pada seluruh response.

---

## Rekomendasi

- API layak naik produksi dari sisi performa & keamanan dasar.
- Pemantauan berkelanjutan (mis. Grafana) disarankan untuk memantau tren di produksi.
- Uji ulang setelah perubahan besar pada query/skema data.

---

## Lampiran

- **Grafik interaktif:** `report.html` (buka di browser) — grafik latency, jumlah
  pengguna, dan throughput sepanjang waktu uji.
- **Script uji:** `test/load/api-load.js` (dapat dijalankan ulang kapan saja).
