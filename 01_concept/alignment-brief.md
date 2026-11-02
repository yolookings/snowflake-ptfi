# Alignment Brief — PTFI Mine Intelligence Dashboard

Dokumen ini menjadi kontrak scope untuk dashboard read-only berbasis Snowflake. Data pada visualisasi hanya boleh
berasal dari database sumber; ketika koneksi gagal, dashboard tidak menampilkan data pengganti.

## Shared understanding

| Dimensi | Kesepakatan / asumsi kerja |
|---|---|
| Business outcome | Membantu pengguna membaca produksi ore, kesehatan fleet, biaya operasi, dan kesiapan pengiriman dalam satu cockpit. |
| Primary users | Executive Operation Manager, supervisor pit, fleet/maintenance analyst, logistics coordinator, dan data learner. |
| Permissions | Read-only untuk seluruh dashboard; tidak ada input atau query dari browser. |
| Entry trigger | Pengguna membuka aplikasi untuk memantau periode operasi dari Snowflake. |
| Happy path | Hubungkan ke Snowflake → atur periode/mineral/pit/shift → baca KPI → drill-down chart → buka detail operasi. |
| Completion | Pengguna mendapatkan ringkasan KPI dan menemukan area yang perlu perhatian dari data aktual sumber. |
| Business rules | KPI mengikuti filter aktif; attainment = actual / target; uptime = rata-rata uptime; readiness adalah rata-rata kesiapan shipment. |
| Data | Tabel Snowflake pada database `FREEPORT_MINING_DB`; nama schema/tabel dikonfigurasi melalui `.env`. |
| Statuses | Fleet: Normal, Monitoring, Maintenance. Shipment: In Transit, Ready to Load, At Port, Documentation Hold. |
| Alternate states | Loading, Snowflake belum terhubung, credential belum diisi, tabel kosong, dan hasil filter kosong ditampilkan tanpa fallback dummy. |
| Prototype tier | Demo-ready React + Vite dashboard dengan chart interaktif, filter, drill-down, dan asset logo lokal. |
| Scope | Executive overview, production detail, fleet detail, logistics control tower, dan Snowflake read-only bridge. |
| Non-goals | Authentication/authorization produksi, IoT streaming nyata, alerting, write-back transaksi, forecasting, dan deployment production. |
| Demo scenario | Hubungkan ke Snowflake → ambil 14 hari terakhir → cek produksi terbaru vs target → drill-down ke pit → buka shipment watchlist. |

## Decision record

| Decision | Chosen answer | Reason | Owner |
|---|---|---|---|
| Frontend | React + Vite berbasis npm | Perubahan terbaru pengguna: UI portal perlu lebih rapi, fleksibel, dan memakai CSS portal. | Project owner |
| Data source | Snowflake server-side read-only | Credential tetap di server dan dashboard tidak menampilkan data palsu ketika koneksi gagal. | Project owner |
| Warehouse guardrail | `X-SMALL`, `AUTO_SUSPEND = 60`, `AUTO_RESUME = TRUE` | Menghemat resource saat latihan. | Project owner |
| Visual system | Struktur shell Avian Prototype, warna/logo Freeport/PTFI | Mengikuti referensi struktur yang diminta sekaligus memakai identitas visual yang tersedia. | Project owner |

## Assumptions and unknowns

- **Assumption:** Seluruh data operasi awal berada di wilayah Papua; bila region bertambah, seed data dan filter perlu diperluas.
- **Assumption:** Definisi biaya operasi mengikuti kolom sumber Snowflake dan belum diperlakukan sebagai angka finansial resmi.
- **Unknown:** Nama schema dan tabel pada `FREEPORT_MINING_DB` perlu dikonfirmasi; sementara dapat diatur melalui `.env`.
- **Unknown:** Definisi resmi KPI uptime, readiness, dan ore quality perlu dikonfirmasi sebelum dipakai untuk keputusan operasional.

## Requirements coverage handoff

| Requirement | Prototype evidence |
|---|---|
| KPI produksi harian | `Executive Overview` menampilkan Produksi terakhir, target attainment, tren actual vs target. |
| Uptime alat berat | KPI uptime dan halaman `Fleet & Equipment` dengan breakdown asset type/status. |
| Biaya operasional | KPI biaya operasional periode terpilih dari tabel produksi Snowflake. |
| Drill-down pit/shift/mineral | Dropdown drill-down di overview dan selector dimensi di `Production Detail`. |
| Filter dinamis | Sidebar rentang tanggal, wilayah, mineral, pit, dan shift. |
| Logistik pelabuhan | `Logistics Control Tower` dengan readiness, ETA, tujuan, status, dan manifest. |
| Koneksi Snowflake | Header dan empty state menunjukkan status koneksi; dashboard kosong ketika Snowflake belum terhubung. |
| Hemat resource | `snowflake/01_create_objects.sql` menetapkan warehouse X-SMALL dengan `AUTO_SUSPEND = 60`. |

