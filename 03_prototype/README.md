# Prototype handoff

Prototype aktif menggunakan React + Vite dan dijalankan dari root project dengan `npm run api` serta
`npm run dev`.

- `src/components/` — shell portal, navbar, drawer mobile, dan komponen UI.
- `src/pages/` — dashboard overview, production, fleet, dan logistics.
- `src/styles/avian.css` — design token Avian yang diadaptasi ke warna Freeport/PTFI.
- `public/brand/` — logo Freeport/PTFI lokal.
- `server/` — bridge read-only untuk membaca database `FREEPORT_MINING_DB`.
- `snowflake/` — script setup dan seed referensi.

Jika Snowflake belum terhubung, UI menampilkan empty state dan tidak menggunakan data dummy lokal.
