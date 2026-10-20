# Alignment Brief — PTFI Mine Intelligence Dashboard

Dokumen ini menjadi kontrak scope untuk prototipe dashboard latihan query Snowflake. Istilah “real-time”
di prototipe berarti status data terakhir yang dimuat; data demo tetap sintetis dan tidak merepresentasikan
kondisi operasi PTFI.

## Shared understanding

| Dimensi | Kesepakatan / asumsi kerja |
|---|---|
| Business outcome | Membantu pengguna membaca produksi ore, kesehatan fleet, biaya operasi, dan kesiapan pengiriman dalam satu cockpit. |
| Primary users | Executive Operation Manager, supervisor pit, fleet/maintenance analyst, logistics coordinator, dan data learner. |
| Permissions | Read-only untuk dashboard. SQL Lab boleh menjalankan query SELECT; tidak ada write-back dari aplikasi. |
| Entry trigger | Pengguna membuka aplikasi untuk memantau periode operasi atau mencoba query terhadap tabel latihan. |
| Happy path | Pilih sumber data → atur rentang tanggal/mineral/pit/shift → baca KPI → drill-down chart → buka SQL Lab untuk memvalidasi agregasi. |
| Completion | Pengguna mendapatkan ringkasan KPI, menemukan area yang perlu perhatian, atau memperoleh hasil query yang bisa diunduh CSV. |
| Business rules | KPI mengikuti filter aktif; attainment = actual / target; uptime = rata-rata uptime; readiness adalah rata-rata kesiapan shipment. |
| Data | `production_daily`, `equipment_daily`, `logistics_shipments`; sumber demo lokal atau tabel Snowflake `PTFI_MINE_ANALYTICS.OPERATIONS`. |
| Statuses | Fleet: Normal, Monitoring, Maintenance. Shipment: In Transit, Ready to Load, At Port, Documentation Hold. |
| Alternate states | Empty filter, Snowflake unavailable, query error, no credentials, loading/cached data, dan query result kosong ditangani sebagai state demo. |
| Prototype tier | Demo-ready React + Vite prototype dengan chart interaktif, filter, drill-down, SQL editor, dan asset logo lokal. |
| Scope | Executive overview, production detail, fleet detail, logistics control tower, SQL Lab, Snowflake setup scripts, dan auto-suspend 60 detik. |
| Non-goals | Authentication/authorization produksi, IoT streaming nyata, alerting, write-back transaksi, forecasting, dan deployment production. |
| Demo scenario | Ambil 14 hari terakhir → cek produksi terbaru vs target → drill-down ke pit → buka shipment watchlist → jalankan query produksi per pit. |

## Decision record

| Decision | Chosen answer | Reason | Owner |
|---|---|---|---|
| Frontend | React + Vite berbasis npm | Perubahan terbaru pengguna: UI portal perlu lebih rapi, fleksibel, dan memakai CSS portal. | Project owner |
| Data fallback | Demo lokal deterministic di browser | Aplikasi dapat dipakai tanpa mengekspos kredensial Snowflake dari browser. | Project owner |
| Warehouse guardrail | `X-SMALL`, `AUTO_SUSPEND = 60`, `AUTO_RESUME = TRUE` | Menghemat resource saat latihan. | Project owner |
| Visual system | Struktur shell Avian Prototype, warna/logo Freeport/PTFI | Mengikuti referensi struktur yang diminta sekaligus memakai identitas visual yang tersedia. | Project owner |

## Assumptions and unknowns

- **Assumption:** Seluruh data operasi awal berada di wilayah Papua; bila region bertambah, seed data dan filter perlu diperluas.
- **Assumption:** Biaya operasi pada prototipe adalah biaya sintetis per baris produksi, bukan angka finansial resmi.
- **Unknown:** Mekanisme autentikasi, role Snowflake, dan bentuk ingestion IoT produksi belum ditentukan; tidak memblokir prototipe latihan.
- **Unknown:** Definisi resmi KPI uptime, readiness, dan ore quality perlu dikonfirmasi sebelum dipakai untuk keputusan operasional.

## Requirements coverage handoff

| Requirement | Prototype evidence |
|---|---|
| KPI produksi harian | `Executive Overview` menampilkan Produksi terakhir, target attainment, tren actual vs target. |
| Uptime alat berat | KPI uptime dan halaman `Fleet & Equipment` dengan breakdown asset type/status. |
| Biaya operasional | KPI biaya operasional periode terpilih dari tabel produksi demo. |
| Drill-down pit/shift/mineral | Dropdown drill-down di overview dan selector dimensi di `Production Detail`. |
| Filter dinamis | Sidebar rentang tanggal, wilayah, mineral, pit, dan shift. |
| Logistik pelabuhan | `Logistics Control Tower` dengan readiness, ETA, tujuan, status, dan manifest. |
| Latihan query Snowflake | `Snowflake SQL Lab`, data dictionary, query examples, hasil tabel, dan download CSV. |
| Hemat resource | `snowflake/01_create_objects.sql` menetapkan warehouse X-SMALL dengan `AUTO_SUSPEND = 60`. |

