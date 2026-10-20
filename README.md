# PTFI Mine Intelligence Dashboard

Prototype dashboard operasi tambang dan logistik berbasis React + Vite. Shell navigasi, kartu data, menu
dropdown, mobile drawer, dan kepadatan tabel mengikuti pola portal Avian; token visual dan aset brand memakai
warna cyan–navy–merah serta logo Freeport/PTFI.

## Menjalankan aplikasi

```bash
npm install
npm run dev
```

Buka URL yang ditampilkan Vite, biasanya `http://localhost:4173`.

Untuk validasi production build:

```bash
npm run check
```

## Isi prototype

- **Executive Overview** — KPI produksi, uptime alat, biaya operasi, shipment readiness, tren actual vs target,
  drill-down pit/shift/mineral, fleet health, dan shipment watchlist.
- **Production Detail** — kontribusi produksi, attainment snapshot, dan tabel baris query-ready.
- **Fleet & Equipment** — uptime per tipe alat, status maintenance, dan asset register.
- **Logistics Control Tower** — volume per destination port, readiness watchlist, dan manifest.
- **Snowflake SQL Lab** — editor query, starter query, data dictionary, dan adapter preview lokal.

SQL Lab di browser memakai data demo deterministic agar prototype dapat berjalan tanpa mengekspos kredensial
Snowflake. Query yang ditampilkan sengaja menggunakan nama tabel/kolom yang sama dengan seed Snowflake sehingga
bisa dipindahkan ke worksheet Snowflake.

## Environment dan secret

Salin [`.env.example`](.env.example) menjadi `.env` untuk konfigurasi lokal. File `.env` diabaikan oleh Git dan
tidak boleh berisi nilai dengan prefix `VITE_` untuk kredensial, karena nilai `VITE_*` akan ikut masuk ke bundle
browser. Prototype saat ini belum melakukan koneksi Snowflake dari browser; variabel `SNOWFLAKE_*` disiapkan untuk
adapter server-side di tahap berikutnya.

## Snowflake

Jalankan file berikut dari Snowflake SQL Worksheet atau SnowSQL:

1. [`snowflake/01_create_objects.sql`](snowflake/01_create_objects.sql) — database, schema, tabel, dan warehouse.
2. [`snowflake/02_seed_demo_data.sql`](snowflake/02_seed_demo_data.sql) — data latihan sintetis.
3. [`snowflake/03_practice_queries.sql`](snowflake/03_practice_queries.sql) — playbook query.

Warehouse `MINE_ANALYTICS_WH` dikonfigurasi `X-SMALL`, `AUTO_RESUME = TRUE`, dan `AUTO_SUSPEND = 60` detik
untuk menjaga resource tetap hemat selama latihan.

## Struktur project

```text
src/
├── components/       # app shell, navbar, mobile drawer, UI primitives
├── data/              # navigation dan deterministic dashboard data
├── lib/               # formatter dan helper
├── pages/             # overview, detail, fleet, logistics, SQL Lab
└── styles/            # design token + Freeport portal CSS
public/brand/          # logo Freeport/PTFI yang dipakai aplikasi
snowflake/             # DDL, seed, dan practice queries
```

> Semua angka pada browser adalah data sintetis untuk latihan; bukan data operasional resmi PTFI.
