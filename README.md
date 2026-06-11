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
9. [Cara Kerja Autentikasi](#cara-kerja-autentikasi)
10. [Cara Kerja Notifikasi](#cara-kerja-notifikasi)
11. [Cara Kerja Laporan (Reports)](#cara-kerja-laporan-reports)
12. [Panduan Konsistensi UI](#panduan-konsistensi-ui)

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js (App Router) |
| Bahasa | TypeScript |
| Database | MongoDB (via custom `lib/db.ts`) |
| Styling | Tailwind CSS + inline styles |
| Font | Poppins (Google Fonts) |
| Charts | Recharts |
| Icons | Icons8 (CDN) |
| Auth | Cookie session (`chillo_session`, httpOnly) |

---

## Cara Menjalankan

```bash
# 1. Install dependencies
npm install

# 2. Buat file environment
cp .env.example .env.local
# Isi MONGODB_URI (lihat bagian Variabel Lingkungan)

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
│   │   │   └── [id]/route.ts     DELETE resep
│   │   ├── reports/route.ts      GET data laporan dengan filter periode
│   │   ├── waste/route.ts        GET & POST log pemborosan
│   │   └── profile/route.ts      GET & PUT profil pengguna
│   ├── dashboard/page.tsx        Halaman utama (Stock Overview)
│   ├── inventory/page.tsx        Manajemen bahan makanan
│   ├── notifications/page.tsx    Peringatan kadaluarsa
│   ├── recipes/page.tsx          Koleksi resep
│   ├── reports/page.tsx          Waste analytics
│   ├── profile/page.tsx          Profil & pengaturan akun
│   ├── login/page.tsx            Halaman login & registrasi
│   ├── layout.tsx                Root layout
│   └── globals.css               CSS global + animasi
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx         Wrapper dengan Navbar + padding
│   │   ├── Navbar.tsx            Fixed navbar + hamburger mobile + badge notif
│   │   └── Footer.tsx
│   └── ui/
│       ├── StatusBadge.tsx       Badge Expired / Xd left / Safe
│       └── StatusBar.tsx         Progress bar warna berdasarkan status
└── lib/
    ├── db.ts                     Koneksi MongoDB singleton
    ├── actions.ts                Server actions: login, signup, logout
    └── dateUtils.ts              ⚠️ SUMBER KEBENARAN kalkulasi tanggal
```

---

## Aturan Penting: Kalkulasi Tanggal

> **Semua kalkulasi kadaluarsa WAJIB menggunakan fungsi dari `lib/dateUtils.ts`.**  
> Jangan buat fungsi kalkulasi tanggal baru di page atau API manapun.

### Mengapa ini penting?

`new Date("2025-06-10")` di JavaScript mem-parse string sebagai **UTC midnight**, bukan local midnight. Di server dengan timezone UTC+7, ini berarti item yang expired tanggal 10 Juni akan terdeteksi sebagai expired sejak pukul 00:00 UTC = 07:00 WIB tanggal 10 Juni. Ini menyebabkan status yang salah antar halaman.

### Fungsi yang tersedia

```typescript
import { calcDaysLeft, getStatus, expiryLabel, notifExpiryPhrase } from '@/lib/dateUtils'

// Hitung sisa hari (negatif = sudah expired)
const daysLeft = calcDaysLeft("2025-06-10")  // contoh hasil: -2 jika hari ini 12 Juni

// Status bucket (konsisten di semua page)
const status = getStatus(daysLeft)           // 'expired' | 'almost' | 'safe'

// Label untuk UI Priority Attention
const label = expiryLabel(daysLeft, status)  // "Expired 2 days ago"

// Frasa untuk judul notifikasi
const phrase = notifExpiryPhrase(daysLeft)   // "expires tomorrow"
```

### Threshold status

| daysLeft | Status | Contoh label |
|---|---|---|
| `< 0` | `expired` | "Expired 2d ago" |
| `0` | `almost` | "Expires today" |
| `1` | `almost` | "Expires tomorrow" |
| `2–3` | `almost` | "Expires in 2d" |
| `> 3` | `safe` | "5d left" |

---

## Halaman & Fitur

### `/dashboard` — Stock Overview

Halaman utama setelah login, memberikan gambaran cepat kondisi inventaris.

- **Stat cards**: Total Items, Expiring Soon, Expired
- **Priority Attention**: Daftar item yang sudah expired atau akan habis dalam 3 hari ke depan (maks. 4 kartu ditampilkan)
- **Smart Insight**: Pesan dinamis yang membedakan kondisi inventaris secara akurat:
  - Jika ada item expired DAN hampir expired → pesan gabungan dengan jumlah masing-masing
  - Jika hanya ada expired → pesan untuk segera buang/cek
  - Jika hanya hampir expired → pesan untuk segera masak
  - Jika semua aman → pesan positif
  - Tombol aksi menyesuaikan: `Check Inventory` saat ada expired, `Browse Recipes` saat hanya hampir expired
- **Recent Inventory**: 5 item terbaru dari inventaris

### `/inventory` — Manajemen Inventory

Halaman pengelolaan bahan makanan lengkap.

- Tampilan tabel (desktop) dan card list (mobile)
- Filter: All, Safe, Expiring, Expired — dengan counter masing-masing
- Pencarian real-time berdasarkan nama item
- **Add / Edit item** dengan field:
  - Name, Category (10 pilihan), Quantity, Unit
  - Purchase Price (IDR, dengan format separator ribuan otomatis)
  - Purchase Date, Expiration Date
- **Hapus item** dengan pilihan alasan:
  - `Used for Cooking` → item dihapus dari inventory
  - `Spoiled / Discarded` → item dihapus + dicatat ke collection `waste` → muncul di Reports

### `/recipes` — Koleksi Resep

- 20 resep kurasi bawaan (masakan Asia & Indonesia) yang tidak bisa dihapus
- Tab **All Recipes** (kurasi + milik user) dan **My Recipes** (hanya milik user)
- Filter: Breakfast, Lunch, Dinner, Vegetarian, Under 30 mins
- Pencarian berdasarkan judul, deskripsi, atau bahan
- **Add resep manual**: judul, deskripsi, kategori, cook time, difficulty, foto upload, daftar bahan, langkah-langkah
- Hapus resep milik sendiri (dengan konfirmasi)
- Klik resep → detail tampil dalam modal overlay

### `/reports` — Waste Analytics

Dashboard analitik pemborosan bahan makanan.

- Filter periode: **Harian** (7 hari), **Mingguan** (4 minggu), **Bulanan** (6 bulan)
- **Inventory Snapshot**: Angka real-time dari MongoDB (Total, Safe, Expiring Soon, Expired)
- **Financial Impact**: Estimasi total kerugian dalam Rupiah dari item yang dibuang
- **Kitchen Score**: Skor 0–100 kesehatan dapur berdasarkan jumlah item expired & wasted
- **Chart Waste by Category**: Donut chart distribusi pemborosan per kategori
- **Chart Items Removed**: Bar chart Cooked vs Discarded per periode
- **Waste Log**: Tabel item yang dibuang karena basi dengan timestamp
- **Export CSV**: Download log pemborosan sebagai file CSV

### `/notifications` — Peringatan Kadaluarsa

- Notifikasi otomatis dari inventaris: item expired + akan expired dalam 3 hari
- Badge merah di navbar menampilkan jumlah notif yang belum dibaca
- Klik satu notif → notif tersebut ditandai sebagai sudah dibaca → badge berkurang
- Tombol "Mark all read" untuk menandai semua sekaligus
- Badge di navbar diperbarui secara polling setiap 5 detik

### `/profile` — Profil Pengguna

- Lihat nama dan email akun yang sedang aktif
- Edit nama tampilan
- Tombol Sign Out

### `/login` — Autentikasi

- Tab Login dan Sign Up dalam satu halaman
- Validasi client-side dengan pesan error per field
- Submit via Server Actions (`lib/actions.ts`)
- Password di-hash dengan SHA-256 sebelum disimpan

---

## API Routes

### Inventory

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/api/inventory` | Ambil semua item milik user yang sedang login |
| POST | `/api/inventory` | Tambah item baru |
| PUT | `/api/inventory/[id]` | Edit item yang ada |
| DELETE | `/api/inventory/[id]` | Hapus item (body: `{ reason }`) |

Ketika DELETE dengan `reason: "Spoiled / Discarded"`, server otomatis:
1. Mengambil data item dari DB
2. Menghitung `estLoss` dari `item.price` atau estimasi per kategori
3. Menyimpan ke collection `waste`
4. Menyimpan ke collection `removed_items` (untuk chart trend)
5. Menghapus dari collection `inventory`

### Notifications

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/api/notifications` | Generate + upsert auto-notif, return semua notif user |
| PATCH | `/api/notifications` | Body: `{ id }` — mark satu notif sebagai read |
| POST | `/api/notifications/read-all` | Mark semua notif user sebagai read |

### Reports

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/api/reports?period=Daily\|Weekly\|Monthly` | Data laporan lengkap sesuai periode |

### Recipes

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/api/recipes` | Ambil semua resep tersimpan milik user |
| POST | `/api/recipes` | Simpan resep baru |
| DELETE | `/api/recipes/[id]` | Hapus resep milik user |

### Profil

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/api/profile` | Ambil data profil user yang sedang login |
| PUT | `/api/profile` | Update nama user |

### Waste

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/api/waste` | Ambil log pemborosan milik user |
| POST | `/api/waste` | Tambah entri waste baru (dipanggil otomatis dari DELETE inventory) |

---

## Database Collections (MongoDB)

### `users`

```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string",
  "password": "string (SHA-256 hash)",
  "createdAt": "Date"
}
```

### `sessions`

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "token": "string (random 48 bytes hex)",
  "email": "string",
  "name": "string",
  "expiresAt": "Date (30 hari dari login)",
  "createdAt": "Date"
}
```

### `inventory`

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "name": "string",
  "category": "Fruit | Vegetable | Dairy | Meat | Seafood | Pantry | Frozen | Beverages | Snacks | Other",
  "quantity": "number",
  "unit": "string (pcs, kg, g, L, dll)",
  "purchaseDate": "string YYYY-MM-DD",
  "expirationDate": "string YYYY-MM-DD",
  "price": "number | null (IDR)",
  "createdAt": "Date"
}
```

### `waste`

Diisi otomatis saat item dihapus dengan alasan `"Spoiled / Discarded"`.

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "name": "string",
  "category": "string",
  "reason": "Spoiled / Discarded",
  "estLoss": "number (IDR)",
  "createdAt": "Date"
}
```

### `removed_items`

Diisi untuk semua penghapusan (dimasak + dibuang) — digunakan oleh chart "Items Removed".

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "name": "string",
  "category": "string",
  "reason": "Used for Cooking | Spoiled / Discarded",
  "createdAt": "Date"
}
```

### `notifications`

Di-upsert otomatis oleh `GET /api/notifications`.

```json
{
  "_id": "string (format: auto_<inventoryId>)",
  "userId": "ObjectId",
  "type": "string",
  "title": "string",
  "body": "string",
  "icon": "string (URL)",
  "read": "boolean",
  "createdAt": "Date"
}
```

### `recipes`

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "title": "string",
  "description": "string",
  "time": "string (misal: '30 min')",
  "difficulty": "Easy | Sedang | Susah",
  "category": "string",
  "tag": "string | null",
  "image": "string (base64 data URL) | null",
  "ingredients": "string[]",
  "steps": "string[]",
  "source": "manual",
  "createdAt": "Date"
}
```

---

## Cara Kerja Autentikasi

1. User mengisi form login/signup di `/login`.
2. Form di-submit via **Server Action** (`loginAction` / `signupAction` di `lib/actions.ts`).
3. Server memverifikasi kredensial (email + password SHA-256).
4. Jika berhasil, server membuat token sesi acak (48 bytes hex) dan menyimpannya ke collection `sessions` dengan TTL 30 hari.
5. Token disimpan di cookie `chillo_session` (httpOnly, secure di production).
6. Setiap API route memvalidasi sesi dengan mengecek token dari cookie ke collection `sessions`.
7. Logout menghapus record dari `sessions` dan menghapus cookie.

---

## Cara Kerja Notifikasi

1. Setiap kali Navbar di-mount atau route berubah, Navbar melakukan fetch ke `GET /api/notifications`.
2. Server mem-parse setiap item inventaris menggunakan `calcDaysLeft()` dari `lib/dateUtils.ts`.
3. Untuk item expired/expiring, server melakukan **upsert** ke collection `notifications` dengan `$setOnInsert: { read: false }` — status `read: true` yang sudah ada tidak ditimpa.
4. Untuk item yang sudah aman kembali (misalnya tanggal diubah), notifnya dihapus dari DB.
5. Navbar menghitung `unreadCount` dari response dan menampilkan badge merah.
6. Ketika user klik satu notif → `PATCH /api/notifications` → satu record di-update `read: true` → badge berkurang saat polling berikutnya (interval 5 detik).

---

## Cara Kerja Laporan (Reports)

### Periode filter

| Filter | Rentang data | Bucket |
|---|---|---|
| Harian | 7 hari terakhir | Per hari |
| Mingguan | 4 minggu terakhir | Per minggu |
| Bulanan | 6 bulan terakhir | Per bulan |

### Inventory Snapshot

Dihitung langsung dari collection `inventory` menggunakan `calcDaysLeft()` — **tidak** dari collection waste atau cache. Ini memastikan angka selalu konsisten dengan yang ditampilkan di Dashboard.

### Financial Impact

- Jika item memiliki field `price`: `estLoss = price` (harga beli penuh dianggap hilang)
- Jika tidak ada price: estimasi default berdasarkan kategori:

| Kategori | Estimasi (IDR) |
|---|---|
| Meat | 50.000 |
| Seafood | 45.000 |
| Dairy | 25.000 |
| Fruit | 15.000 |
| Vegetable | 12.000 |
| Lainnya | 10.000 |

### Kitchen Score

```
score = 100 - (expiredCount / totalCount × 50) - (wastedCount × 3)
```

Minimum 0, maksimum 100. Item expired memberikan penalti lebih besar karena merepresentasikan kegagalan pencegahan.

---

## Panduan Konsistensi UI

### Bahasa

- **Label / Header / Button**: Bahasa Inggris (`Item Name`, `Category`, `Save`, `Cancel`, `Actions`)
- **Deskripsi / Placeholder / Sub-text**: Bahasa Indonesia (`cth: Apel Malang`, `Kelola dan pantau bahan makanan segar kamu`)

### Font

Poppins via Google Fonts. Gunakan konstanta `PP = "'Poppins', sans-serif"` di setiap page/component.

### Warna Utama

| Token | Nilai | Penggunaan |
|---|---|---|
| Hijau utama | `#3d5429` | Button primer, aksen aktif, background Smart Insight |
| Hijau muda | `#4f6d35` | Link, hover state |
| Kuning | `#d97706` | Status hampir expired |
| Merah | `#dc2626` | Status expired, error |
| Krem | `#f0ece0` | Background card sekunder |
| Border | `#e0dbc8` | Border card, divider |

### Status Badge

| Status | Warna teks | Warna background |
|---|---|---|
| `expired` | `#dc2626` | `#fee2e2` |
| `almost` | `#d97706` | `#fef3c7` |
| `safe` | `#3d5429` | `#e6eddc` |

### Kategori Bahan

10 kategori tersedia: `Fruit`, `Vegetable`, `Dairy`, `Meat`, `Seafood`, `Pantry`, `Frozen`, `Beverages`, `Snacks`, `Other`.

Setiap kategori memiliki warna background dan ikon konsisten yang digunakan di seluruh halaman (Dashboard, Inventory, Reports).

### Animasi

Class animasi tersedia di `globals.css`:
- `animate-slide-up` — fade + geser dari bawah
- `stagger-1` hingga `stagger-4` — delay bertahap untuk efek cascade
- `animate-pulse` — skeleton loading state