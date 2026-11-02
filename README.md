# PTFI Mine Intelligence Dashboard

Dashboard read-only bergaya laporan Power BI untuk memantau produksi tambang, kondisi alat berat, dan
pengiriman (logistik) PT Freeport Indonesia. Semua angka dibaca langsung dari database Snowflake
`FREEPORT_MINING_DB`; tidak ada data dummy lokal, dan jika Snowflake belum terhubung halaman menampilkan status
`Snowflake belum terhubung`. Tujuannya agar supervisor dan analis bisa melihat kondisi operasi harian dalam satu
layar tanpa membuka query atau spreadsheet.

## Cara kerja sistem

```text
Browser (React + Vite)  ──GET /api/dashboard──▶  Bridge Node (server/)  ──snowflake-sdk──▶  Snowflake
        ▲                                                │
        └──── JSON { status, data, source } ◀────────────┘
```

1. **Browser** memuat halaman dan memanggil `GET /api/dashboard` (`src/lib/api.js`). Browser tidak pernah memegang
   credential Snowflake.
2. **Bridge Node** (`server/`) membaca credential dari environment variable, membuka satu koneksi Snowflake yang
   dipakai ulang, lalu menjalankan 3 query `SELECT` (produksi, alat berat, pengiriman) secara paralel.
3. Baris hasil query dinormalisasi ke bentuk camelCase (tanggal `YYYY-MM-DD`, angka `Number`) dan dikirim sebagai
   JSON. Jika credential kosong atau query gagal, bridge mengembalikan `status: "disconnected"` dengan
   `data` kosong, dan detail error hanya dicetak di terminal server.
4. **Frontend** menyimpan semua data di memori (`App.jsx`), lalu menerapkan filter (periode, mineral, pit, shift)
   di sisi klien. Tiap halaman menghitung KPI dan chart dari data yang sudah terfilter.
5. Di halaman Overview, klik kolom pit/shift atau irisan mineral akan mengubah filter seluruh halaman
   (cross-filter ala Power BI). Visual yang difilter tidak menyembunyikan dirinya sendiri, hanya memudarkan bagian
   yang tidak dipilih.

Aplikasi ini **read-only**: tidak ada input data, menu query, atau SQL tulis dari browser. Profil di kanan atas
(`src/data/users.js`) hanya label tampilan "Maulana — Viewer", bukan sistem login.

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env     # lalu isi credential Snowflake
npm run api              # terminal 1: bridge di http://127.0.0.1:8787
npm run dev              # terminal 2: Vite di http://localhost:4173
```

Cek koneksi: `curl http://127.0.0.1:8787/api/dashboard` harus mengembalikan `"status":"connected"`.

Validasi sebelum commit: `npm run check` (format, lint, build).

## Environment variable

| Variable | Fungsi |
| --- | --- |
| `SNOWFLAKE_ACCOUNT` | Account identifier, mis. `orgname-accountname` |
| `SNOWFLAKE_USER` | User Snowflake |
| `SNOWFLAKE_PASSWORD` | Password (atau pakai `SNOWFLAKE_PRIVATE_KEY_PATH` untuk key-pair) |
| `SNOWFLAKE_ROLE` | Role yang punya `USAGE` + `SELECT` pada tabel |
| `SNOWFLAKE_AUTHENTICATOR` | Default `snowflake` |
| `SNOWFLAKE_WAREHOUSE` | Warehouse untuk menjalankan query |
| `SNOWFLAKE_DATABASE` / `SNOWFLAKE_SCHEMA` | Default `FREEPORT_MINING_DB` / `ANALYTICS` |
| `SNOWFLAKE_PRODUCTION_TABLE` / `_EQUIPMENT_TABLE` / `_SHIPMENT_TABLE` | Default `PRODUCTION` / `EQUIPMENT` / `SHIPMENT` |
| `API_PORT` | Port bridge lokal, default `8787` (tidak dipakai di Vercel) |

`.env` dan `env.txt` sudah masuk `.gitignore`. Jangan memakai prefix `VITE_` untuk secret karena akan masuk ke
bundle browser. `env.txt` adalah salinan `.env` tanpa komentar dan nilai kosong, dipakai untuk fitur
**Import .env** di Vercel (Project Settings → Environment Variables).

> **Catatan deploy Vercel:** `server/index.js` adalah server Node yang berjalan terus-menerus (lokal). Vercel
> hanya menjalankan serverless function, jadi untuk produksi endpoint `/api/dashboard` perlu dibungkus sebagai
> function (mis. `api/dashboard.js` yang memanggil `getDashboardData()`). Environment variable di atas tetap sama.

## Sumber data

| Tabel | Kolom yang dibaca |
| --- | --- |
| `PRODUCTION` | `OPERATION_DATE, REGION, PIT_NAME, MINERAL, SHIFT, ORE_TONNES, TARGET_TONNES, GRADE_PCT, OPERATING_COST_USD, LOADED_TRUCKS` |
| `EQUIPMENT` | `OPERATION_DATE, ASSET_ID, ASSET_TYPE, PIT_NAME, HOURS_AVAILABLE, HOURS_OPERATING, UPTIME_PCT, FUEL_LITERS, MAINTENANCE_STATUS` |
| `SHIPMENT` | `SHIPMENT_ID, VESSEL_NAME, MINERAL, SOURCE_PIT, DESTINATION_PORT, DISPATCH_DATE, ETA_DATE, TONNES, READINESS_PCT, STATUS` |

Produksi dan alat berat hanya diambil 45 hari terakhir. Script pembuat tabel ada di `snowflake/`.

## Halaman dashboard

- **Overview** — 6 KPI (total ore, pencapaian target, grade, biaya, uptime, tonase pengiriman), tren harian,
  komposisi mineral, produksi per pit/shift, status alat, tonase per tujuan, dan daftar pengiriman.
- **Production Detail** — kontribusi produksi, attainment terhadap target, dan baris produksi.
- **Fleet & Equipment** — uptime per tipe alat, jam operasi, fuel, dan status maintenance.
- **Logistics Control Tower** — readiness, ETA, tujuan, status, dan manifest shipment.

## Struktur file dan fungsinya

```text
├── index.html                  # entry HTML Vite
├── vite.config.js              # plugin React, port dev 4173, proxy /api → 127.0.0.1:8787
├── package.json                # script: dev, api, build, lint, fmt, check
├── .env / .env.example         # credential lokal (diabaikan Git) / template aman
├── env.txt                     # salinan .env untuk Import di Vercel (diabaikan Git)
├── server/
│   ├── index.js
│   └── snowflakeClient.js
├── snowflake/                  # SQL referensi: 01 create objects, 02 seed demo, 03 practice queries
├── 01_concept/, 03_prototype/  # dokumen konsep dan catatan prototype Avian
└── src/
    ├── main.jsx                # mount React, load CSS
    ├── App.jsx
    ├── lib/
    ├── data/
    ├── pages/
    ├── components/
    └── styles/
```

### `server/`

| File / fungsi | Pengertian |
| --- | --- |
| `index.js` | HTTP server tanpa framework. Rute: `GET /api/health` (status konfigurasi) dan `GET /api/dashboard` (data); selain itu 404. Error tak terduga dibalas 500 generik. |
| `isConfigured()` | Cek apakah account, user, dan password/private key sudah terisi. |
| `safeIdentifier()` / `tableName()` | Validasi nama schema/tabel dengan regex agar aman disisipkan ke SQL (mencegah injeksi lewat env). |
| `connect()` | Membuat koneksi Snowflake sekali dan menyimpannya (`connectionPromise`); direset saat gagal agar bisa dicoba lagi. Mendukung password atau key-pair. |
| `execute(sql)` | Menjalankan satu query dan mengembalikan baris hasilnya. |
| `getField()` | Mengambil kolom tanpa peduli kapitalisasi nama kolom. |
| `normalizeDate()` / `numberValue()` | Menyeragamkan tanggal ke `YYYY-MM-DD` dan nilai ke angka. |
| `normalizeProductionRow` / `EquipmentRow` / `ShipmentRow` | Mengubah baris Snowflake ke objek yang dipakai frontend. |
| `describeError()` / `disconnectedPayload()` | Membuat log error yang tidak membocorkan secret dan payload "belum terhubung". |
| `snowflakeStatus()` | Dipakai `/api/health`. |
| `getDashboardData()` | Fungsi utama: menjalankan 3 query paralel dan membangun respons `{ status, mode, message, data, source }`. |

### `src/`

| File | Pengertian |
| --- | --- |
| `App.jsx` | Root aplikasi: mengambil data, menyimpan status koneksi, filter, dan halaman aktif; menyediakan Refresh, Export CSV, dan toast. |
| `lib/api.js` | `fetchDashboardData()` — pemanggil `GET /api/dashboard`. |
| `lib/formatters.js` | Format angka, ton, mata uang, persen, dan tanggal (locale `id-ID`). |
| `data/dashboard.js` | Logika data: `filterDashboardData` (terapkan filter periode/mineral/pit/shift), `getFilterOptions` (isi dropdown dari data), `groupBy`, `summarizeProduction`, `DEFAULT_FILTERS`. |
| `data/navigation.js` | Definisi menu dan judul tiap modul. |
| `data/users.js` | Profil tampilan (Maulana, Viewer). |
| `pages/ExecutiveOverview.jsx` | Halaman laporan utama: KPI, chart, dan cross-filter. |
| `pages/ProductionDetail.jsx` | Detail produksi per pit, mineral, dan shift. |
| `pages/FleetEquipment.jsx` | Detail uptime, fuel, dan status alat. |
| `pages/LogisticsControlTower.jsx` | Detail pengiriman dan ETA. |
| `components/layout/` | `AppShell` (kerangka halaman), `Navbar` (menu atas + profil), `MobileSidebar` (menu mobile). |
| `components/ui/FilterBar.jsx` | Slicer periode, mineral, pit, shift. |
| `components/ui/DataConnectionState.jsx` | Tampilan status loading / belum terhubung / data kosong. |
| `components/ui/` lainnya | Blok kecil: `DataTable`, `Panel`, `MetricCard`, `Badge`, `ProgressBar`, `PageHeader`, `SectionHeading`, `Icon`. |
| `styles/avian.css` | Design token dan gaya portal dasar. |
| `styles/report.css` | Lapisan gaya laporan Power BI (slicer, KPI, visual); dimuat setelah `avian.css` sehingga menimpanya. |
