// =============================================================================
// UNIT TEST — Chillo: Logika Inti (Pure Functions)
// File ini TIDAK mengimport apapun dari project — semua fungsi di-copy inline
// persis dari source code sehingga Jest bisa langsung jalan tanpa konfigurasi alias.
//
// Jalankan:
//   npx jest unit_dateUtils.test.ts
// =============================================================================

// ─── 1. calcDaysLeft ─────────────────────────────────────────────────────────
// Sumber: app/dashboard/page.tsx & app/inventory/page.tsx (identik)
function calcDaysLeft(exp: string): number {
  const parts = exp.split('-')
  const local = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.ceil((local.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

// ─── 2. calcDaysLeftNotif ────────────────────────────────────────────────────
// Sumber: app/api/notifications/route.ts & app/api/reports/route.ts
// Versi 2-param: menerima todayStr eksplisit (UTC-safe untuk server Vercel)
function calcDaysLeftNotif(expirationDateStr: string, todayStr: string): number {
  const [ey, em, ed] = String(expirationDateStr).split('-').map(Number)
  const [ty, tm, td] = todayStr.split('-').map(Number)
  const expMs = Date.UTC(ey, em - 1, ed)
  const todMs = Date.UTC(ty, tm - 1, td)
  return Math.round((expMs - todMs) / (1000 * 60 * 60 * 24))
}

// ─── 3. getStatus ────────────────────────────────────────────────────────────
// Sumber: app/dashboard/page.tsx & app/inventory/page.tsx
function getStatus(d: number): 'safe' | 'almost' | 'expired' {
  return d < 0 ? 'expired' : d <= 3 ? 'almost' : 'safe'
}

// ─── 4. priorityLabel ────────────────────────────────────────────────────────
// Sumber: app/dashboard/page.tsx
function priorityLabel(daysLeft: number, status: string): string {
  if (status === 'expired') return `Expired ${Math.abs(daysLeft)}d ago`
  if (daysLeft === 0) return 'Expires today'
  if (daysLeft === 1) return 'Expires tomorrow'
  return `Expires in ${daysLeft}d`
}

// ─── 5. calcEstLoss ──────────────────────────────────────────────────────────
// Sumber: app/api/inventory/[id]/route.ts
const idrFactors: Record<string, number> = {
  Meat: 50000, Seafood: 60000, Dairy: 25000, Produce: 15000,
  Fruit: 20000, Vegetable: 15000, Pantry: 20000, Frozen: 30000,
  Beverages: 18000, Snacks: 15000, Other: 15000,
}

function calcEstLoss(price: number | null, category: string, quantity: number): number {
  if (price !== null && price > 0) return Number(price)
  return (idrFactors[category] || 15000) * (Number(quantity) || 1)
}

// ─── 6. calcKitchenScore ─────────────────────────────────────────────────────
// Sumber: app/api/reports/route.ts
function calcKitchenScore(totalItems: number, expiredCount: number, wastedCount: number): number {
  if (totalItems === 0) return 100
  return Math.max(0, Math.round(100 - (expiredCount / totalItems) * 50 - wastedCount * 3))
}

// ─── 7. Validasi signup ───────────────────────────────────────────────────────
// Sumber: lib/actions.ts — signupAction (bagian validasi, sebelum hit DB)
function validateSignup(name: string, email: string, password: string):
  { valid: true } | { valid: false; field: string; message: string } {
  const n = name?.trim() ?? ''
  const e = email?.trim().toLowerCase() ?? ''
  const p = password ?? ''
  if (!n || !e || !p)       return { valid: false, field: 'general',  message: 'Please fill in all fields.' }
  if (n.length < 2)         return { valid: false, field: 'name',     message: 'Name must be at least 2 characters.' }
  if (!e.includes('@') || !e.includes('.'))
                             return { valid: false, field: 'email',    message: 'Please enter a valid email address.' }
  if (p.length < 6)         return { valid: false, field: 'password', message: 'Password must be at least 6 characters.' }
  return { valid: true }
}

// ─── 8. Validasi login ────────────────────────────────────────────────────────
// Sumber: lib/actions.ts — loginAction (bagian validasi, sebelum hit DB)
function validateLogin(email: string, password: string):
  { valid: true } | { valid: false; field: string; message: string } {
  const e = email?.trim().toLowerCase() ?? ''
  const p = password ?? ''
  if (!e || !p)      return { valid: false, field: 'general',  message: 'Please fill in all fields.' }
  if (!e.includes('@')) return { valid: false, field: 'email',    message: 'Please enter a valid email address.' }
  if (p.length < 6)  return { valid: false, field: 'password', message: 'Password must be at least 6 characters.' }
  return { valid: true }
}

// ─── Helper: tanggal relatif hari ini ────────────────────────────────────────
function dateOffset(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// =============================================================================
// GROUP 1 — calcDaysLeft (versi client-side, 1 param)
// =============================================================================
describe('calcDaysLeft() — versi halaman (1 param, lokal)', () => {
  test('UT-01: tanggal hari ini → 0', () => {
    expect(calcDaysLeft(dateOffset(0))).toBe(0)
  })
  test('UT-02: besok → 1', () => {
    expect(calcDaysLeft(dateOffset(1))).toBe(1)
  })
  test('UT-03: 3 hari ke depan → 3', () => {
    expect(calcDaysLeft(dateOffset(3))).toBe(3)
  })
  test('UT-04: 10 hari ke depan → 10', () => {
    expect(calcDaysLeft(dateOffset(10))).toBe(10)
  })
  test('UT-05: kemarin → -1 (expired)', () => {
    expect(calcDaysLeft(dateOffset(-1))).toBe(-1)
  })
  test('UT-06: 5 hari lalu → -5', () => {
    expect(calcDaysLeft(dateOffset(-5))).toBe(-5)
  })
  test('UT-07: 30 hari ke depan → 30', () => {
    expect(calcDaysLeft(dateOffset(30))).toBe(30)
  })
})

// =============================================================================
// GROUP 2 — calcDaysLeftNotif (versi server/notifikasi, 2 param)
// =============================================================================
describe('calcDaysLeftNotif() — versi server/notif (2 param, UTC-safe)', () => {
  test('UT-08: same date → 0', () => {
    expect(calcDaysLeftNotif('2026-06-10', '2026-06-10')).toBe(0)
  })
  test('UT-09: besok → 1', () => {
    expect(calcDaysLeftNotif('2026-06-11', '2026-06-10')).toBe(1)
  })
  test('UT-10: 3 hari ke depan → 3', () => {
    expect(calcDaysLeftNotif('2026-06-13', '2026-06-10')).toBe(3)
  })
  test('UT-11: kemarin → -1', () => {
    expect(calcDaysLeftNotif('2026-06-09', '2026-06-10')).toBe(-1)
  })
  test('UT-12: 7 hari lalu → -7', () => {
    expect(calcDaysLeftNotif('2026-06-03', '2026-06-10')).toBe(-7)
  })
  test('UT-13: lintas bulan — 30 Jun ke 1 Jul → 1 hari', () => {
    expect(calcDaysLeftNotif('2026-07-01', '2026-06-30')).toBe(1)
  })
  test('UT-14: lintas tahun — 31 Des ke 1 Jan → 1 hari', () => {
    expect(calcDaysLeftNotif('2027-01-01', '2026-12-31')).toBe(1)
  })
})

// =============================================================================
// GROUP 3 — getStatus
// =============================================================================
describe('getStatus()', () => {
  test('UT-15: daysLeft -1 → "expired"', () => {
    expect(getStatus(-1)).toBe('expired')
  })
  test('UT-16: daysLeft -10 → "expired"', () => {
    expect(getStatus(-10)).toBe('expired')
  })
  test('UT-17: daysLeft 0 → "almost" (hari ini)', () => {
    expect(getStatus(0)).toBe('almost')
  })
  test('UT-18: daysLeft 1 → "almost"', () => {
    expect(getStatus(1)).toBe('almost')
  })
  test('UT-19: daysLeft 3 → "almost" (batas atas)', () => {
    expect(getStatus(3)).toBe('almost')
  })
  test('UT-20: daysLeft 4 → "safe" (tepat di atas threshold)', () => {
    expect(getStatus(4)).toBe('safe')
  })
  test('UT-21: daysLeft 30 → "safe"', () => {
    expect(getStatus(30)).toBe('safe')
  })
})

// =============================================================================
// GROUP 4 — priorityLabel
// =============================================================================
describe('priorityLabel()', () => {
  test('UT-22: expired 1 hari → "Expired 1d ago"', () => {
    expect(priorityLabel(-1, 'expired')).toBe('Expired 1d ago')
  })
  test('UT-23: expired 5 hari → "Expired 5d ago"', () => {
    expect(priorityLabel(-5, 'expired')).toBe('Expired 5d ago')
  })
  test('UT-24: daysLeft 0 → "Expires today"', () => {
    expect(priorityLabel(0, 'almost')).toBe('Expires today')
  })
  test('UT-25: daysLeft 1 → "Expires tomorrow"', () => {
    expect(priorityLabel(1, 'almost')).toBe('Expires tomorrow')
  })
  test('UT-26: daysLeft 3 → "Expires in 3d"', () => {
    expect(priorityLabel(3, 'almost')).toBe('Expires in 3d')
  })
  test('UT-27: daysLeft 10 → "Expires in 10d"', () => {
    expect(priorityLabel(10, 'safe')).toBe('Expires in 10d')
  })
})

// =============================================================================
// GROUP 5 — calcEstLoss
// =============================================================================
describe('calcEstLoss()', () => {
  test('UT-28: ada price → pakai price langsung', () => {
    expect(calcEstLoss(75000, 'Meat', 1)).toBe(75000)
  })
  test('UT-29: price null, Meat qty=2 → 50000 × 2 = 100000', () => {
    expect(calcEstLoss(null, 'Meat', 2)).toBe(100000)
  })
  test('UT-30: price null, Dairy qty=1 → 25000', () => {
    expect(calcEstLoss(null, 'Dairy', 1)).toBe(25000)
  })
  test('UT-31: price null, Seafood qty=3 → 60000 × 3 = 180000', () => {
    expect(calcEstLoss(null, 'Seafood', 3)).toBe(180000)
  })
  test('UT-32: price null, Fruit qty=2 → 20000 × 2 = 40000', () => {
    expect(calcEstLoss(null, 'Fruit', 2)).toBe(40000)
  })
  test('UT-33: kategori tidak dikenal → fallback 15000', () => {
    expect(calcEstLoss(null, 'Unknown', 1)).toBe(15000)
  })
  test('UT-34: qty 0 → dianggap 1 (||1 fallback)', () => {
    expect(calcEstLoss(null, 'Vegetable', 0)).toBe(15000)
  })
  test('UT-35: Frozen qty=1 → 30000', () => {
    expect(calcEstLoss(null, 'Frozen', 1)).toBe(30000)
  })
})

// =============================================================================
// GROUP 6 — calcKitchenScore
// =============================================================================
describe('calcKitchenScore()', () => {
  test('UT-36: inventaris kosong → 100', () => {
    expect(calcKitchenScore(0, 0, 0)).toBe(100)
  })
  test('UT-37: tidak ada expired/wasted → 100', () => {
    expect(calcKitchenScore(10, 0, 0)).toBe(100)
  })
  test('UT-38: semua expired (ratio=1) → 100 - 50 = 50', () => {
    expect(calcKitchenScore(10, 10, 0)).toBe(50)
  })
  test('UT-39: 5 wasted, tidak ada expired → 100 - 15 = 85', () => {
    expect(calcKitchenScore(10, 0, 5)).toBe(85)
  })
  test('UT-40: skenario realistis — 10 item, 2 expired, 3 wasted → 100-10-9=81', () => {
    expect(calcKitchenScore(10, 2, 3)).toBe(81)
  })
  test('UT-41: skor tidak boleh negatif → clamp ke 0', () => {
    expect(calcKitchenScore(10, 10, 50)).toBe(0)
  })
  test('UT-42: 4 item, 2 expired (ratio 0.5), 5 wasted → 100-25-15=60', () => {
    expect(calcKitchenScore(4, 2, 5)).toBe(60)
  })
  test('UT-43: 1 item total, 1 expired, 0 wasted → 100-50=50', () => {
    expect(calcKitchenScore(1, 1, 0)).toBe(50)
  })
})

// =============================================================================
// GROUP 7 — validateSignup
// =============================================================================
describe('validateSignup()', () => {
  test('UT-44: semua valid → {valid: true}', () => {
    expect(validateSignup('Budi Santoso', 'budi@email.com', 'password123')).toEqual({ valid: true })
  })
  test('UT-45: name kosong → field general', () => {
    const r = validateSignup('', 'budi@email.com', 'password123') as any
    expect(r.valid).toBe(false)
    expect(r.field).toBe('general')
  })
  test('UT-46: name 1 karakter → field name', () => {
    const r = validateSignup('A', 'budi@email.com', 'password123') as any
    expect(r.valid).toBe(false)
    expect(r.field).toBe('name')
  })
  test('UT-47: name tepat 2 karakter → valid', () => {
    expect(validateSignup('Bu', 'budi@email.com', 'password123')).toEqual({ valid: true })
  })
  test('UT-48: email tanpa @ → field email', () => {
    const r = validateSignup('Budi', 'budiemail.com', 'password123') as any
    expect(r.valid).toBe(false)
    expect(r.field).toBe('email')
  })
  test('UT-49: email tanpa titik → field email', () => {
    const r = validateSignup('Budi', 'budi@emailcom', 'password123') as any
    expect(r.valid).toBe(false)
    expect(r.field).toBe('email')
  })
  test('UT-50: password < 6 karakter → field password', () => {
    const r = validateSignup('Budi', 'budi@email.com', '123') as any
    expect(r.valid).toBe(false)
    expect(r.field).toBe('password')
    expect(r.message).toBe('Password must be at least 6 characters.')
  })
  test('UT-51: password tepat 6 karakter → valid', () => {
    expect(validateSignup('Budi', 'budi@email.com', '123456')).toEqual({ valid: true })
  })
  test('UT-52: semua field kosong → field general', () => {
    const r = validateSignup('', '', '') as any
    expect(r.valid).toBe(false)
    expect(r.field).toBe('general')
  })
})

// =============================================================================
// GROUP 8 — validateLogin
// =============================================================================
describe('validateLogin()', () => {
  test('UT-53: email & password valid → {valid: true}', () => {
    expect(validateLogin('budi@email.com', 'password123')).toEqual({ valid: true })
  })
  test('UT-54: email kosong → field general', () => {
    const r = validateLogin('', 'password123') as any
    expect(r.valid).toBe(false)
    expect(r.field).toBe('general')
  })
  test('UT-55: email tanpa @ → field email', () => {
    const r = validateLogin('budiemail.com', 'password123') as any
    expect(r.valid).toBe(false)
    expect(r.field).toBe('email')
  })
  test('UT-56: password < 6 karakter → field password', () => {
    const r = validateLogin('budi@email.com', '123') as any
    expect(r.valid).toBe(false)
    expect(r.field).toBe('password')
  })
  test('UT-57: kedua field kosong → field general', () => {
    const r = validateLogin('', '') as any
    expect(r.valid).toBe(false)
    expect(r.field).toBe('general')
  })
  test('UT-58: password tepat 6 karakter → valid', () => {
    expect(validateLogin('budi@email.com', '123456')).toEqual({ valid: true })
  })
})
