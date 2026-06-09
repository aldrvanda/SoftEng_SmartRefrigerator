# Chillo — Smart Fridge & Food Waste Tracker

Chillo adalah aplikasi web berbasis Next.js yang membantu pengguna memantau masa kadaluarsa bahan makanan, melacak pemborosan, dan menemukan resep masakan — semuanya terintegrasi secara real-time.

---

## Daftar Isi

1. [Tech Stack](#tech-stack)
2. [Cara Menjalankan](#cara-menjalankan)
3. [Variabel Lingkungan](#variabel-lingkungan)
4. [Struktur Folder](#struktur-folder)
5. [Aturan Penting: Kalkulasi Tanggal](#aturan-penting-kalkulasi-tanggal)
6. [Halaman & Fitur](#halaman--fitur)
7. [API Routes](#api-routes)
8. [Database Collections (MongoDB)](#database-collections-mongodb)
9. [Cara Kerja Notifikasi](#cara-kerja-notifikasi)
10. [Cara Kerja Laporan (Reports)](#cara-kerja-laporan-reports)
11. [Panduan Konsistensi UI](#panduan-konsistensi-ui)

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 15 (App Router) |
| Bahasa | TypeScript |
| Database | MongoDB (via custom `lib/db.ts`) |
| Styling | Tailwind CSS + inline styles (Poppins font) |
| Charts | Recharts |
| Icons | Icons8 (CDN, no emoji) |
| Auth | Cookie session (`chillo_session`) |
| AI Resep | Anthropic Claude API (`/api/generate-recipes`) |

---

## Cara Menjalankan

```bash
# 1. Install dependencies
npm install

# 2. Buat file environment
cp .env.example .env.local
# Isi MONGODB_URI dan ANTHROPIC_API_KEY (lihat bagian Variabel Lingkungan)

# 3. Jalankan dev server
npm run dev

# Buka http://localhost:3000
```

---

## Variabel Lingkungan

Buat file `.env.local` di root project (sejajar dengan `package.json`):

```env
# Wajib — koneksi MongoDB Atlas atau lokal
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/chillo

```

---

## Struktur Folder

```
chillo/
├── app/
│   ├── api/
│   │   ├── inventory/
│   │   │   ├── route.ts          GET semua item, POST item baru
│   │   │   └── [id]/route.ts     PUT edit, DELETE hapus (+ log waste)
│   │   ├── notifications/
│   │   │   ├── route.ts          GET auto-notif, PATCH mark satu read
│   │   │   └── read-all/route.ts POST mark semua read
│   │   ├── recipes/
│   │   │   ├── route.ts          GET semua resep user, POST simpan
│   │   │   └── [id]/route.ts     DELETE, PUT edit resep
│   │   ├── reports/route.ts      GET data laporan dengan filter periode
│   │   ├── generate-recipes/route.ts  POST generate AI resep dari inventory
│   │   ├── waste/route.ts        GET log pemborosan
│   │   └── auth/...              Login, register, logout
│   ├── dashboard/page.tsx
│   ├── inventory/page.tsx
│   ├── notifications/page.tsx
│   ├── recipes/page.tsx
│   ├── reports/page.tsx
│   ├── profile/page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx         Wrapper dengan Navbar + Footer
│   │   ├── Navbar.tsx            Fixed navbar + hamburger mobile + badge notif
│   │   └── Footer.tsx
│   └── ui/
│       ├── StatusBadge.tsx       Badge Expired / X days left
│       └── StatusBar.tsx         Progress bar warna berdasarkan status
└── lib/
    ├── db.ts                     Koneksi MongoDB singleton
    └── dateUtils.ts              ⚠️ SUMBER KEBENARAN kalkulasi tanggal
```

---

## Aturan Penting: Kalkulasi Tanggal

> **Semua kalkulasi kadaluarsa WAJIB menggunakan fungsi dari `lib/dateUtils.ts`.**
> Jangan buat fungsi kalkulasi tanggal baru di page atau API manapun.

### Mengapa ini penting?

`new Date("2025-06-10")` di JavaScript mem-parse string sebagai **UTC midnight**, bukan local midnight. Di server dengan timezone UTC+7, ini berarti item yang expired tanggal 10 Juni akan terdeteksi sebagai expired sejak pukul 00:00 UTC = 07:00 WIB tanggal 10 Juni. Ini menyebabkan notifikasi salah (bilang "expires today" padahal sudah expired).

### Fungsi yang tersedia

```typescript
import { calcDaysLeft, getStatus, expiryLabel, notifExpiryPhrase } from '@/lib/dateUtils'

// Hitung sisa hari (negative = sudah expired)
const daysLeft = calcDaysLeft("2025-06-10")  // hasil: -2 jika hari ini 12 Juni

// Status bucket (sama di semua page)
// expired: daysLeft < 0
// almost:  daysLeft 0–3
// safe:    daysLeft > 3
const status = getStatus(daysLeft)           // hasil: 'expired' | 'almost' | 'safe'

// Label untuk UI Priority Attention
const label = expiryLabel(daysLeft, status)  // hasil: "Expired 2 days ago"

// Frasa untuk judul notifikasi
const phrase = notifExpiryPhrase(daysLeft)   // hasil: "expires tomorrow"
```

### Threshold status (konsisten di semua tempat)

| daysLeft | Status | Contoh |
|---|---|---|
| `< 0` | `expired` | "Expired yesterday", "Expired 5 days ago" |
| `0` | `almost` | "Expires today" |
| `1` | `almost` | "Expires tomorrow" |
| `2–3` | `almost` | "Expires in 2 days", "Expires in 3 days" |
| `> 3` | `safe` | "5d left", "30d left" |

---

## Halaman & Fitur

### `/dashboard` — Stock Overview
- Statistik cepat: Total Items, Expiring Soon, Expired
- **Priority Attention**: item yang expired atau akan habis dalam 2 hari ke depan
- **Smart Insight**: pesan dinamis berdasarkan kondisi inventory
- **Recent Inventory**: 5 item terbaru

### `/inventory` — Manajemen Inventory
- Tabel desktop + card list mobile
- Filter: All, Safe, Expiring, Expired (dengan counter)
- Pencarian real-time
- Add/Edit item: Name, Category (10 jenis), Quantity, Unit, Purchase Price (IDR dengan separator ribuan), Purchase Date, Expiration Date
- Hapus item dengan pilihan alasan:
  - **Used for Cooking** → item hilang dari inventory
  - **Spoiled / Discarded** → item hilang + dicatat ke `waste` collection → muncul di Reports

### `/recipes` — Koleksi Resep
- 20 resep kurasi (Asia & Indonesia)
- Tab "All Recipes" dan "My Recipes"
- Filter: Breakfast, Lunch, Dinner, Vegetarian, Under 30 mins
- Pencarian berdasarkan judul, deskripsi, atau bahan
- Add resep manual: judul, deskripsi, kategori, cook time (otomatis append "min"), difficulty, foto upload, ingredients, steps
- Hapus resep milik sendiri
- Detail resep dalam modal

### `/reports` — Waste Analytics
- Filter periode: Harian (7 hari), Mingguan (4 minggu), Bulanan (6 bulan)
- **Inventory Snapshot**: angka real-time dari MongoDB (sama persis dengan Dashboard)
- **Financial Impact**: estimasi kerugian dalam Rupiah (dari harga yang diinput user)
- **Kitchen Score**: skor 0–100 berdasarkan jumlah item expired & wasted
- **Chart Waste by Category**: donut chart
- **Chart Items Removed**: bar chart Cooked vs Discarded per periode
- **Waste Log**: tabel item yang dibuang karena basi
- Export CSV

### `/notifications` — Peringatan Kadaluarsa
- Auto-notif dari inventory: expired items + expiring dalam 3 hari
- Klik satu notif → mark satu notif sebagai read → badge berkurang 1
- "Mark all read" untuk semua sekaligus
- Badge merah di navbar diperbarui setiap 5 detik

### `/profile` — Profil Pengguna
- Lihat dan edit nama, email, password

---

## API Routes

### Inventory
| Method | Path | Deskripsi |
|---|---|---|
| GET | `/api/inventory` | Ambil semua item milik user |
| POST | `/api/inventory` | Tambah item baru |
| PUT | `/api/inventory/[id]` | Edit item |
| DELETE | `/api/inventory/[id]` | Hapus item (body: `{ reason }`) |

Ketika DELETE dengan `reason: "Spoiled / Discarded"`, server otomatis:
1. Ambil item dari DB
2. Hitung `estLoss` dari `item.price` atau estimasi per kategori
3. Insert ke collection `waste`
4. Insert ke collection `removed_items` (untuk chart)
5. Delete dari `inventory`

### Notifications
| Method | Path | Deskripsi |
|---|---|---|
| GET | `/api/notifications` | Generate + upsert auto-notif, return semua |
| PATCH | `/api/notifications` | Body: `{ id }` — mark satu notif read |
| POST | `/api/notifications/read-all` | Mark semua notif read |

### Reports
| Method | Path | Deskripsi |
|---|---|---|
| GET | `/api/reports?period=Daily\|Weekly\|Monthly` | Data laporan lengkap |

### Recipes
| Method | Path | Deskripsi |
|---|---|---|
| GET | `/api/recipes` | Semua resep tersimpan milik user |
| POST | `/api/recipes` | Simpan resep baru |
| DELETE | `/api/recipes/[id]` | Hapus resep |
| POST | `/api/generate-recipes` | Generate resep dari inventory via Anthropic AI |

---

## Database Collections (MongoDB)

### `users`
```json
{ "_id", "name", "email", "password" (hashed), "createdAt" }
```

### `sessions`
```json
{ "_id", "userId", "token", "expiresAt" }
```

### `inventory`
```json
{
  "_id", "userId", "name", "category",
  "quantity", "unit",
  "purchaseDate",     // "YYYY-MM-DD"
  "expirationDate",   // "YYYY-MM-DD"
  "price",            // number | null (IDR)
  "createdAt"
}
```

### `waste`
Diisi otomatis saat item dihapus dengan alasan "Spoiled / Discarded".
```json
{ "_id", "userId", "name", "category", "reason", "estLoss" (IDR), "createdAt" }
```

### `removed_items`
Diisi untuk semua penghapusan (dimasak + dibuang) — digunakan oleh chart "Items Removed".
```json
{ "_id", "userId", "name", "category", "reason", "createdAt" }
```

### `notifications`
Auto-upserted oleh `GET /api/notifications`.
```json
{
  "_id",       // "auto_<inventoryId>" untuk auto-notif
  "userId", "type", "title", "body", "icon",
  "read",      // boolean — diperbarui via PATCH
  "createdAt"
}
```

### `recipes`
```json
{
  "_id", "userId", "title", "description",
  "time", "difficulty", "category", "tag",
  "image",        // base64 data URL atau null
  "ingredients",  // string[]
  "steps",        // string[]
  "source",       // "manual" | "ai"
  "createdAt"
}
```

---

## Cara Kerja Notifikasi

1. Setiap kali Navbar di-mount atau route berubah, Navbar fetch `GET /api/notifications`.
2. Server mem-parse setiap item inventory menggunakan `calcDaysLeft()` dari `lib/dateUtils.ts`.
3. Untuk item expired/expiring, server melakukan **upsert** ke collection `notifications` dengan `$setOnInsert: { read: false }` — artinya jika notif sudah ada dan sudah dibaca, status `read: true` tidak ditimpa.
4. Untuk item yang sudah aman kembali, notifnya dihapus dari DB.
5. Navbar menghitung `unreadCount` dari hasil response dan tampilkan badge merah.
6. Ketika user klik satu notif → `PATCH /api/notifications` dengan ID → satu record di DB di-update `read: true` → saat Navbar poll berikutnya (5 detik), badge berkurang.

---

## Cara Kerja Laporan (Reports)

### Periode filter
| Filter | Rentang data |
|---|---|
| Harian | 7 hari terakhir, bucket per hari |
| Mingguan | 4 minggu terakhir, bucket per minggu |
| Bulanan | 6 bulan terakhir, bucket per bulan |

### Inventory Snapshot
Dihitung langsung dari collection `inventory` menggunakan `calcDaysLeft()` — **tidak** dari collection waste atau cache. Ini memastikan angka selalu sama dengan yang ditampilkan di Dashboard.

### Financial Impact
- Jika item memiliki field `price`: `estLoss = price` (harga beli penuh dianggap hilang)
- Jika tidak ada price: estimasi berdasarkan kategori (Meat: 50.000, Dairy: 25.000, dll.)

### Kitchen Score
```
score = 100 - (expiredRatio × 50) - (wastedCount × 3)
```
Minimum 0, maksimum 100. Item expired meningkatkan penalti lebih besar.

---

## Panduan Konsistensi UI

### Bahasa
- **Label/Header/Button**: English (`Item Name`, `Category`, `Save`, `Cancel`, `Actions`)
- **Deskripsi/Placeholder/Sub-text**: Indonesia (`cth: Apel Malang`, `Kelola dan pantau bahan makanan segar kamu`)

### Font
Poppins (Google Fonts). Konstanta `PP = "'Poppins', sans-serif"` di setiap page.

### Warna utama
| Peran | Warna |
|---|---|
| Primary (sage green) | `#3d5429` |
| Background | `#f5f2e8` (cream) |
| Border | `#e0dbc8` |
| Expired | `#dc2626` |
| Almost | `#d97706` |
| Safe | `#4f6d35` |

### Status badges
Gunakan class CSS dari `globals.css`: `.badge-expired`, `.badge-almost`, `.badge-safe`

### Responsif
- Mobile: 1 kolom, modal slide dari bawah, hamburger menu
- Tablet (sm): 2 kolom
- Desktop (md/lg): 2–3 kolom
- Font size menggunakan `clamp()` untuk scaling otomatis
- Semua modal: `items-end sm:items-center`, `borderRadius: '20px 20px 0 0'` di mobile

### Icons
Semua ikon dari **Icons8** via CDN. Tidak ada emoji di UI.
Format URL: `https://img.icons8.com/ios/<size>/<color>/<name>.png`
