// Load test multi-endpoint untuk API (k6) — laporan dengan verdict per endpoint.
//
// Tiap iterasi VU menembak semua endpoint di bawah (mensimulasikan satu sesi pengguna),
// dan tiap endpoint diberi tag `name` sehingga latency-nya terpisah di laporan.
// Threshold dipasang PER endpoint -> di ringkasan langsung terlihat ✓/✗ masing-masing.
//
// Jalankan:
//   k6 run test/load/api-load.js                                       # default 127.0.0.1:3000
//   k6 run -e BASE_URL=http://103.196.153.161:3010/api test/load/api-load.js
//   k6 run -e PEAK_VUS=100 test/load/api-load.js
//
// Laporan HTML (grafik) — set env sebelum run:
//   K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=test/load/report.html k6 run ...
//
// PENTING agar angka jujur (lihat README):
//   - Naikkan THROTTLE_LIMIT di server dulu, kalau tidak request kena 429 (rate-limit).
//   - Ukur di build produksi (node dist), bukan dev server (pino-pretty melambat saat dibebani).
//   - Pakai 127.0.0.1, bukan localhost (Windows: localhost->IPv6 menambah ~200ms/request).
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://127.0.0.1:3000/api';
const EMAIL = __ENV.EMAIL || 'admin@example.com';
const PASSWORD = __ENV.PASSWORD || 'admin123';
const PEAK_VUS = Number(__ENV.PEAK_VUS || 50);

// Endpoint GET (read-only) yang diuji. Tambah/kurangi sesuai kebutuhan.
const ENDPOINTS = [
  { name: 'GET /users', path: '/users' },
  { name: 'GET /auth/me', path: '/auth/me' },
];

// Threshold per endpoint (latency hanya dari response sukses, 429 tidak dihitung)
// + threshold global. Ringkasan k6 akan menampilkan ✓/✗ untuk tiap baris ini.
const thresholds = {
  http_req_failed: ['rate<0.01'], // < 1% request gagal
  checks: ['rate>0.99'], // > 99% check lolos
};
for (const e of ENDPOINTS) {
  thresholds[`http_req_duration{name:${e.name},expected_response:true}`] = [
    'p(95)<500',
    'p(99)<1000',
  ];
}

export const options = {
  stages: [
    { duration: '10s', target: Math.ceil(PEAK_VUS * 0.2) },
    { duration: '20s', target: Math.ceil(PEAK_VUS * 0.6) },
    { duration: '15s', target: PEAK_VUS },
    { duration: '5s', target: 0 },
  ],
  thresholds,
};

// Login sekali di awal; token dibagikan ke semua VU.
export function setup() {
  const res = http.post(
    `${BASE}/auth/login`,
    JSON.stringify({ email: EMAIL, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  const token = res.json('data.accessToken');
  if (!token) throw new Error(`Login gagal: ${res.status} ${res.body}`);
  return { token };
}

export default function (data) {
  const headers = { Authorization: `Bearer ${data.token}` };
  for (const e of ENDPOINTS) {
    const res = http.get(`${BASE}${e.path}`, { headers, tags: { name: e.name } });
    check(res, { [`${e.name} -> 200`]: (r) => r.status === 200 }, { name: e.name });
    sleep(0.3);
  }
}
