# Chillo Upgrade — File Changes Summary

Salin semua file di folder ini ke project Next.js kamu sesuai path yang sama.

## File Baru (buat folder jika belum ada)
- `app/api/reports/route.ts`          — Backend report terintegrasi inventory + waste + periode filter
- `app/api/recipes/route.ts`          — Backend GET/POST resep ke MongoDB
- `app/api/recipes/[id]/route.ts`     — Backend DELETE/PUT resep

## File Diupgrade
- `app/api/inventory/[id]/route.ts`   — DELETE sekarang kirim reason; spoiled otomatis log ke waste
- `app/inventory/page.tsx`            — Delete reason dikirim ke API, optimistic UI update
- `app/reports/page.tsx`              — Chart bar (added vs wasted), filter period aktif, Smart Tips dari kategori inventory user
- `app/recipes/page.tsx`              — Ambil resep dari DB (kosong jika belum ada), generate dari inventory via Anthropic API, add manual, delete
- `app/notifications/page.tsx`        — Klik notif = mark as read satu per satu, badge langsung berkurang
- `components/layout/Navbar.tsx`      — Badge refresh lebih cepat, zero optimistis saat klik bell

## Catatan penting
1. Navbar sudah `sticky top-0` (pinned saat scroll)  
2. Tidak ada emoji — semua icons dari icons8  
3. Saat delete inventory dan pilih "Spoiled / Discarded" → otomatis masuk waste collection → langsung muncul di Reports
4. Reports filter Weekly/Monthly/Yearly sekarang benar-benar query DB dengan date range
5. Smart Tips di Reports disesuaikan dengan kategori dominan inventory user
6. Recipes kosong by default, hanya isi dari yang di-generate atau di-add manual
7. Generate Recipe menggunakan Anthropic API langsung dari browser (sudah ada di artifact config)
