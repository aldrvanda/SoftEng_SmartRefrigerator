// =============================================================================
// INTEGRATION TEST — Chillo API Logic
// Menguji logika handler API route bersama MongoDB in-memory (tanpa Next.js runtime)
//
// Setup:
//   npm install --save-dev jest @types/jest ts-jest mongodb-memory-server
//
// Jalankan:
//   npx jest integration_api.test.ts
// =============================================================================

import { MongoMemoryServer } from 'mongodb-memory-server'
import { MongoClient, ObjectId } from 'mongodb'
import crypto from 'crypto'

// ─── Tipe lokal ──────────────────────────────────────────────────────────────
type Db = ReturnType<MongoClient['db']>

// ─── Globals ─────────────────────────────────────────────────────────────────
let mongod: MongoMemoryServer
let client: MongoClient
let db: Db

// ─── Lifecycle ───────────────────────────────────────────────────────────────
beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  client = await MongoClient.connect(mongod.getUri())
  db = client.db('chillo_test')
})

afterAll(async () => {
  await client.close()
  await mongod.stop()
})

afterEach(async () => {
  const cols = await db.listCollections().toArray()
  for (const c of cols) await db.collection(c.name).deleteMany({})
})

// =============================================================================
// HELPER FUNCTIONS (sama persis dengan logika di source code)
// =============================================================================

function hashPassword(p: string) {
  return crypto.createHash('sha256').update(p).digest('hex')
}

async function createUserAndSession(email = 'test@chillo.com', password = 'rahasia123') {
  const users = db.collection('users')
  const sessions = db.collection('sessions')
  const userResult = await users.insertOne({
    name: 'Test User', email, password: hashPassword(password), createdAt: new Date(),
  })
  const token = crypto.randomBytes(48).toString('hex')
  const userId = userResult.insertedId
  await sessions.insertOne({
    token, userId, email, name: 'Test User', createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  })
  return { userId, token, email, password }
}

async function getSessionUser(token: string | null) {
  if (!token) return null
  return await db.collection('sessions').findOne({ token, expiresAt: { $gt: new Date() } }) ?? null
}

function makeItem(overrides: Record<string, any> = {}) {
  return {
    name: 'Apel Malang', category: 'Fruit', quantity: 3, unit: 'pcs',
    purchaseDate: '2026-06-01', expirationDate: '2026-06-20',
    price: null, createdAt: new Date(), ...overrides,
  }
}

// idrFactors persis dari app/api/inventory/[id]/route.ts
const idrFactors: Record<string, number> = {
  Meat: 50000, Seafood: 60000, Dairy: 25000, Produce: 15000,
  Fruit: 20000, Vegetable: 15000, Pantry: 20000, Frozen: 30000,
  Beverages: 18000, Snacks: 15000, Other: 15000,
}

// calcDaysLeftNotif persis dari app/api/notifications/route.ts
function calcDaysLeftNotif(expirationDateStr: string, todayStr: string): number {
  const [ey, em, ed] = String(expirationDateStr).split('-').map(Number)
  const [ty, tm, td] = todayStr.split('-').map(Number)
  const expMs = Date.UTC(ey, em - 1, ed)
  const todMs = Date.UTC(ty, tm - 1, td)
  return Math.round((expMs - todMs) / (1000 * 60 * 60 * 24))
}

function getTodayStr(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date())
}

// ─── Simulasi handler GET /api/inventory ─────────────────────────────────────
async function inventoryGET(token: string | null) {
  const session = await getSessionUser(token)
  if (!session) return { status: 401, body: { error: 'Unauthorized' } }
  const items = await db.collection('inventory')
    .find({ userId: session.userId }).sort({ expirationDate: 1 }).toArray()
  return { status: 200, body: { items } }
}

// ─── Simulasi handler POST /api/inventory ────────────────────────────────────
async function inventoryPOST(token: string | null, body: Record<string, any>) {
  const session = await getSessionUser(token)
  if (!session) return { status: 401, body: { error: 'Unauthorized' } }
  const { name, category, quantity, unit, purchaseDate, expirationDate, price } = body
  if (!name || !expirationDate)
    return { status: 400, body: { error: 'Name and expiration date are required' } }
  const result = await db.collection('inventory').insertOne({
    userId: session.userId, name,
    category: category || 'Other', quantity: Number(quantity) || 0,
    unit: unit || 'pcs', purchaseDate: purchaseDate || getTodayStr(),
    expirationDate, price: price ? Number(price) : null, createdAt: new Date(),
  })
  return { status: 200, body: { success: true, id: result.insertedId } }
}

// ─── Simulasi handler PUT /api/inventory/[id] ────────────────────────────────
async function inventoryPUT(token: string | null, id: string, body: Record<string, any>) {
  const session = await getSessionUser(token)
  if (!session) return { status: 401, body: { error: 'Unauthorized' } }
  let oid: ObjectId
  try { oid = new ObjectId(id) } catch { return { status: 400, body: { error: 'Invalid ID' } } }
  const { name, category, quantity, unit, purchaseDate, expirationDate, price } = body
  const result = await db.collection('inventory').updateOne(
    { _id: oid, userId: session.userId },
    { $set: { name, category, quantity: Number(quantity), unit, purchaseDate, expirationDate, price: price ? Number(price) : null, updatedAt: new Date() } }
  )
  if (result.matchedCount === 0) return { status: 404, body: { error: 'Item not found' } }
  return { status: 200, body: { success: true } }
}

// ─── Simulasi handler DELETE /api/inventory/[id] ─────────────────────────────
async function inventoryDELETE(token: string | null, id: string, reason = 'Used for cooking') {
  const session = await getSessionUser(token)
  if (!session) return { status: 401, body: { error: 'Unauthorized' } }
  let oid: ObjectId
  try { oid = new ObjectId(id) } catch { return { status: 400, body: { error: 'Invalid ID' } } }
  const item = await db.collection('inventory').findOne({ _id: oid, userId: session.userId })
  if (!item) return { status: 404, body: { error: 'Item not found' } }
  const estLoss = item.price
    ? Number(item.price)
    : (idrFactors[item.category] || 15000) * (Number(item.quantity) || 1)
  if (reason === 'Spoiled / Discarded') {
    await db.collection('waste').insertOne({
      userId: session.userId, name: item.name, category: item.category,
      reason: 'Spoiled / Discarded', estLoss: Math.round(estLoss), createdAt: new Date(),
    })
  }
  await db.collection('removed_items').insertOne({
    userId: session.userId, name: item.name, category: item.category,
    reason, createdAt: new Date(),
  })
  await db.collection('inventory').deleteOne({ _id: oid, userId: session.userId })
  return { status: 200, body: { success: true } }
}

// ─── Simulasi handler GET /api/notifications ─────────────────────────────────
async function notificationsGET(token: string | null) {
  const session = await getSessionUser(token)
  if (!session) return { status: 401, body: { error: 'Unauthorized' } }
  const items = await db.collection('inventory').find({ userId: session.userId }).toArray()
  const todayStr = getTodayStr()
  const notifCol = db.collection('notifications')
  for (const item of items) {
    const daysLeft = calcDaysLeftNotif(item.expirationDate, todayStr)
    const autoId = `auto_${item._id}`
    if (daysLeft < 0) {
      await notifCol.updateOne(
        { _id: autoId, userId: session.userId },
        { $setOnInsert: { read: false, createdAt: new Date() },
          $set: { type: 'expired', title: `${item.name} has expired`, body: 'Remove this item.', icon: 'warning', userId: session.userId } },
        { upsert: true }
      )
    } else if (daysLeft <= 3) {
      const when = daysLeft === 0 ? 'today' : daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`
      await notifCol.updateOne(
        { _id: autoId, userId: session.userId },
        { $setOnInsert: { read: false, createdAt: new Date() },
          $set: { type: 'almost', title: `${item.name} expires ${when}`, body: 'Use it soon.', icon: 'clock', userId: session.userId } },
        { upsert: true }
      )
    } else {
      await notifCol.deleteOne({ _id: autoId, userId: session.userId })
    }
  }
  const all = await notifCol.find({ userId: session.userId }).sort({ createdAt: -1 }).limit(50).toArray()
  return { status: 200, body: { notifications: all } }
}

// ─── Simulasi handler PATCH /api/notifications ───────────────────────────────
async function notificationsPATCH(token: string | null, id: string) {
  const session = await getSessionUser(token)
  if (!session) return { status: 401, body: { error: 'Unauthorized' } }
  await db.collection('notifications').updateOne(
    { _id: id, userId: session.userId },
    { $set: { read: true } }
  )
  return { status: 200, body: { success: true } }
}

// ─── Simulasi handler GET /api/recipes ───────────────────────────────────────
async function recipeGET(token: string | null) {
  const session = await getSessionUser(token)
  if (!session) return { status: 401, body: { error: 'Unauthorized' } }
  const recipes = await db.collection('recipes')
    .find({ userId: session.userId }).sort({ createdAt: -1 }).toArray()
  return { status: 200, body: { recipes } }
}

// ─── Simulasi handler POST /api/recipes ──────────────────────────────────────
async function recipePOST(token: string | null, body: Record<string, any>) {
  const session = await getSessionUser(token)
  if (!session) return { status: 401, body: { error: 'Unauthorized' } }
  const { title, ingredients, steps } = body
  if (!title || !ingredients || !steps)
    return { status: 400, body: { error: 'Title, ingredients, and steps are required' } }
  const result = await db.collection('recipes').insertOne({
    ...body, userId: session.userId, source: body.source || 'manual', createdAt: new Date(),
  })
  return { status: 200, body: { success: true, id: result.insertedId } }
}

// ─── Simulasi handler DELETE /api/recipes/[id] ───────────────────────────────
async function recipeDELETE(token: string | null, id: string) {
  const session = await getSessionUser(token)
  if (!session) return { status: 401, body: { error: 'Unauthorized' } }
  let oid: ObjectId
  try { oid = new ObjectId(id) } catch { return { status: 400, body: { error: 'Invalid ID' } } }
  const result = await db.collection('recipes').deleteOne({ _id: oid, userId: session.userId })
  if (result.deletedCount === 0) return { status: 404, body: { error: 'Recipe not found' } }
  return { status: 200, body: { success: true } }
}

// =============================================================================
// TEST SUITES
// =============================================================================

// ─── GET /api/inventory ───────────────────────────────────────────────────────
describe('IT: GET /api/inventory', () => {
  test('IT-01: sesi valid → 200 + item terurut expirationDate ASC', async () => {
    const { token, userId } = await createUserAndSession()
    await db.collection('inventory').insertMany([
      makeItem({ userId, name: 'Susu',  expirationDate: '2026-07-10' }),
      makeItem({ userId, name: 'Ayam',  expirationDate: '2026-06-15' }),
    ])
    const res = await inventoryGET(token)
    expect(res.status).toBe(200)
    expect(res.body.items).toHaveLength(2)
    expect(res.body.items[0].name).toBe('Ayam')   // tanggal lebih awal
    expect(res.body.items[1].name).toBe('Susu')
  })

  test('IT-02: token null → 401', async () => {
    const res = await inventoryGET(null)
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Unauthorized')
  })

  test('IT-03: token kadaluarsa → 401', async () => {
    const { userId } = await createUserAndSession()
    const expiredToken = 'expired-token-xyz'
    await db.collection('sessions').insertOne({
      token: expiredToken, userId,
      expiresAt: new Date(Date.now() - 1000), createdAt: new Date(),
    })
    const res = await inventoryGET(expiredToken)
    expect(res.status).toBe(401)
  })

  test('IT-04: inventaris kosong → 200 + array kosong', async () => {
    const { token } = await createUserAndSession()
    const res = await inventoryGET(token)
    expect(res.status).toBe(200)
    expect(res.body.items).toHaveLength(0)
  })

  test('IT-05: user lain tidak bisa lihat item user ini', async () => {
    const { token: tokenA, userId: userA } = await createUserAndSession('a@chillo.com')
    const { token: tokenB } = await createUserAndSession('b@chillo.com')
    await db.collection('inventory').insertOne(makeItem({ userId: userA, name: 'Rahasia A' }))
    const resB = await inventoryGET(tokenB)
    expect(resB.body.items).toHaveLength(0)
    const resA = await inventoryGET(tokenA)
    expect(resA.body.items).toHaveLength(1)
  })
})

// ─── POST /api/inventory ──────────────────────────────────────────────────────
describe('IT: POST /api/inventory', () => {
  test('IT-06: body lengkap → 200 + {success, id}', async () => {
    const { token } = await createUserAndSession()
    const res = await inventoryPOST(token, {
      name: 'Tomat', category: 'Vegetable', quantity: 5,
      unit: 'pcs', purchaseDate: '2026-06-01', expirationDate: '2026-06-15',
    })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.id).toBeDefined()
  })

  test('IT-07: name tidak diisi → 400', async () => {
    const { token } = await createUserAndSession()
    const res = await inventoryPOST(token, { expirationDate: '2026-06-15' })
    expect(res.status).toBe(400)
  })

  test('IT-08: expirationDate tidak diisi → 400', async () => {
    const { token } = await createUserAndSession()
    const res = await inventoryPOST(token, { name: 'Apel' })
    expect(res.status).toBe(400)
  })

  test('IT-09: tanpa category → default "Other"', async () => {
    const { token, userId } = await createUserAndSession()
    await inventoryPOST(token, { name: 'Tanpa Kategori', expirationDate: '2026-07-01' })
    const saved = await db.collection('inventory').findOne({ userId, name: 'Tanpa Kategori' })
    expect(saved?.category).toBe('Other')
  })

  test('IT-10: price diisi → tersimpan sebagai number', async () => {
    const { token, userId } = await createUserAndSession()
    await inventoryPOST(token, { name: 'Daging Sapi', expirationDate: '2026-06-10', price: 75000 })
    const saved = await db.collection('inventory').findOne({ userId, name: 'Daging Sapi' })
    expect(saved?.price).toBe(75000)
  })

  test('IT-11: tanpa sesi → 401', async () => {
    const res = await inventoryPOST(null, { name: 'Test', expirationDate: '2026-06-15' })
    expect(res.status).toBe(401)
  })
})

// ─── PUT /api/inventory/[id] ──────────────────────────────────────────────────
describe('IT: PUT /api/inventory/[id]', () => {
  test('IT-12: edit milik sendiri → 200 + data terupdate di DB', async () => {
    const { token, userId } = await createUserAndSession()
    const r = await db.collection('inventory').insertOne(makeItem({ userId }))
    const res = await inventoryPUT(token, r.insertedId.toString(), {
      name: 'Apel Fuji', category: 'Fruit', quantity: 10,
      unit: 'pcs', purchaseDate: '2026-06-01', expirationDate: '2026-07-01',
    })
    expect(res.status).toBe(200)
    const updated = await db.collection('inventory').findOne({ _id: r.insertedId })
    expect(updated?.name).toBe('Apel Fuji')
    expect(updated?.quantity).toBe(10)
  })

  test('IT-13: edit milik user lain → 404 (IDOR protection)', async () => {
    const { userId: ownerId } = await createUserAndSession('owner@chillo.com')
    const { token: attackerToken } = await createUserAndSession('attacker@chillo.com')
    const r = await db.collection('inventory').insertOne(makeItem({ userId: ownerId }))
    const res = await inventoryPUT(attackerToken, r.insertedId.toString(), { name: 'Hacked', category: 'Other', quantity: 1, unit: 'pcs', purchaseDate: '2026-06-01', expirationDate: '2026-07-01' })
    expect(res.status).toBe(404)
    const unchanged = await db.collection('inventory').findOne({ _id: r.insertedId })
    expect(unchanged?.name).toBe('Apel Malang') // tidak berubah
  })

  test('IT-14: ID tidak valid → 400', async () => {
    const { token } = await createUserAndSession()
    const res = await inventoryPUT(token, 'bukan-objectid', { name: 'Test' })
    expect(res.status).toBe(400)
  })
})

// ─── DELETE /api/inventory/[id] ───────────────────────────────────────────────
describe('IT: DELETE /api/inventory/[id]', () => {
  test('IT-15: "Spoiled / Discarded" → item terhapus + waste + removed_items bertambah', async () => {
    const { token, userId } = await createUserAndSession()
    const r = await db.collection('inventory').insertOne(
      makeItem({ userId, name: 'Susu Basi', category: 'Dairy', quantity: 1 })
    )
    const res = await inventoryDELETE(token, r.insertedId.toString(), 'Spoiled / Discarded')
    expect(res.status).toBe(200)
    expect(await db.collection('inventory').findOne({ _id: r.insertedId })).toBeNull()
    expect(await db.collection('waste').countDocuments({ userId })).toBe(1)
    expect(await db.collection('removed_items').countDocuments({ userId })).toBe(1)
    // Dairy tanpa harga → 25000 × 1 = 25000
    const wasteRecord = await db.collection('waste').findOne({ userId })
    expect(wasteRecord?.estLoss).toBe(25000)
  })

  test('IT-16: "Used for cooking" → TIDAK ada di waste, ada di removed_items', async () => {
    const { token, userId } = await createUserAndSession()
    const r = await db.collection('inventory').insertOne(makeItem({ userId }))
    await inventoryDELETE(token, r.insertedId.toString(), 'Used for cooking')
    expect(await db.collection('waste').countDocuments({ userId })).toBe(0)
    expect(await db.collection('removed_items').countDocuments({ userId })).toBe(1)
  })

  test('IT-17: item ada harga → estLoss = price, bukan estimasi kategori', async () => {
    const { token, userId } = await createUserAndSession()
    const r = await db.collection('inventory').insertOne(
      makeItem({ userId, price: 90000, category: 'Meat' })
    )
    await inventoryDELETE(token, r.insertedId.toString(), 'Spoiled / Discarded')
    const wasteRecord = await db.collection('waste').findOne({ userId })
    expect(wasteRecord?.estLoss).toBe(90000) // bukan 50000 (estimasi Meat)
  })

  test('IT-18: estLoss Meat tanpa harga qty=2 → 50000 × 2 = 100000', async () => {
    const { token, userId } = await createUserAndSession()
    const r = await db.collection('inventory').insertOne(
      makeItem({ userId, category: 'Meat', quantity: 2, price: null })
    )
    await inventoryDELETE(token, r.insertedId.toString(), 'Spoiled / Discarded')
    const wasteRecord = await db.collection('waste').findOne({ userId })
    expect(wasteRecord?.estLoss).toBe(100000)
  })

  test('IT-19: hapus milik user lain → 404 (IDOR), item tidak terhapus', async () => {
    const { userId: ownerId } = await createUserAndSession('owner2@chillo.com')
    const { token: attackerToken } = await createUserAndSession('attacker2@chillo.com')
    const r = await db.collection('inventory').insertOne(makeItem({ userId: ownerId }))
    const res = await inventoryDELETE(attackerToken, r.insertedId.toString(), 'Spoiled / Discarded')
    expect(res.status).toBe(404)
    expect(await db.collection('inventory').findOne({ _id: r.insertedId })).not.toBeNull()
  })

  test('IT-20: tanpa sesi → 401', async () => {
    const res = await inventoryDELETE(null, new ObjectId().toString(), 'Spoiled / Discarded')
    expect(res.status).toBe(401)
  })
})

// ─── GET /api/notifications ───────────────────────────────────────────────────
describe('IT: GET /api/notifications', () => {
  // Helper tanggal relatif hari ini dalam format YYYY-MM-DD
  function dateOffsetStr(days: number): string {
    const d = new Date()
    d.setDate(d.getDate() + days)
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }

  test('IT-21: item expired kemarin → notifikasi type "expired" di-generate', async () => {
    const { token, userId } = await createUserAndSession()
    await db.collection('inventory').insertOne(
      makeItem({ userId, name: 'Keju Basi', expirationDate: dateOffsetStr(-1) })
    )
    const res = await notificationsGET(token)
    expect(res.status).toBe(200)
    expect(res.body.notifications).toHaveLength(1)
    expect(res.body.notifications[0].type).toBe('expired')
    expect(res.body.notifications[0].read).toBe(false)
  })

  test('IT-22: item expires today → type "almost", title berisi "today"', async () => {
    const { token, userId } = await createUserAndSession()
    await db.collection('inventory').insertOne(
      makeItem({ userId, name: 'Telur', expirationDate: dateOffsetStr(0) })
    )
    const res = await notificationsGET(token)
    expect(res.body.notifications[0].type).toBe('almost')
    expect(res.body.notifications[0].title).toContain('today')
  })

  test('IT-23: item expires in 1 day → title berisi "tomorrow"', async () => {
    const { token, userId } = await createUserAndSession()
    await db.collection('inventory').insertOne(
      makeItem({ userId, name: 'Yogurt', expirationDate: dateOffsetStr(1) })
    )
    const res = await notificationsGET(token)
    expect(res.body.notifications[0].title).toContain('tomorrow')
  })

  test('IT-24: item safe (> 3 hari) → TIDAK ada notifikasi', async () => {
    const { token, userId } = await createUserAndSession()
    await db.collection('inventory').insertOne(
      makeItem({ userId, expirationDate: dateOffsetStr(10) })
    )
    const res = await notificationsGET(token)
    expect(res.body.notifications).toHaveLength(0)
  })

  test('IT-25: panggil 3x → tetap 1 notifikasi (idempoten, tidak duplikat)', async () => {
    const { token, userId } = await createUserAndSession()
    await db.collection('inventory').insertOne(
      makeItem({ userId, expirationDate: dateOffsetStr(0) })
    )
    await notificationsGET(token)
    await notificationsGET(token)
    const res = await notificationsGET(token)
    expect(res.body.notifications).toHaveLength(1)
  })

  test('IT-26: $setOnInsert — status read=true tidak di-reset setelah upsert ulang', async () => {
    const { token, userId } = await createUserAndSession()
    const inv = await db.collection('inventory').insertOne(
      makeItem({ userId, expirationDate: dateOffsetStr(-1) })
    )
    const autoId = `auto_${inv.insertedId}`
    await notificationsGET(token) // generate pertama kali
    // Tandai sudah dibaca
    await db.collection('notifications').updateOne({ _id: autoId }, { $set: { read: true } })
    // Polling lagi
    const res = await notificationsGET(token)
    const notif = res.body.notifications.find((n: any) => n._id === autoId)
    expect(notif?.read).toBe(true) // tetap true, tidak di-reset
  })

  test('IT-27: item kembali aman → notifikasi dihapus otomatis', async () => {
    const { token, userId } = await createUserAndSession()
    // Insert item yang hampir expired
    const inv = await db.collection('inventory').insertOne(
      makeItem({ userId, expirationDate: dateOffsetStr(1) })
    )
    await notificationsGET(token) // generate notif
    expect(await db.collection('notifications').countDocuments({ userId })).toBe(1)
    // Update expirationDate jadi jauh ke depan (safe)
    await db.collection('inventory').updateOne(
      { _id: inv.insertedId },
      { $set: { expirationDate: dateOffsetStr(30) } }
    )
    await notificationsGET(token) // polling lagi
    expect(await db.collection('notifications').countDocuments({ userId })).toBe(0)
  })

  test('IT-28: tanpa sesi → 401', async () => {
    const res = await notificationsGET(null)
    expect(res.status).toBe(401)
  })
})

// ─── PATCH /api/notifications ─────────────────────────────────────────────────
describe('IT: PATCH /api/notifications', () => {
  test('IT-29: mark as read → read berubah jadi true di DB', async () => {
    const { token, userId } = await createUserAndSession()
    const notifId = 'auto_test123'
    await db.collection('notifications').insertOne(
      { _id: notifId, userId, type: 'almost', read: false, createdAt: new Date() } as any
    )
    const res = await notificationsPATCH(token, notifId)
    expect(res.status).toBe(200)
    const notif = await db.collection('notifications').findOne({ _id: notifId })
    expect(notif?.read).toBe(true)
  })

  test('IT-30: tanpa sesi → 401', async () => {
    const res = await notificationsPATCH(null, 'auto_abc')
    expect(res.status).toBe(401)
  })
})

// ─── POST & GET /api/recipes ──────────────────────────────────────────────────
describe('IT: POST /api/recipes', () => {
  test('IT-31: simpan resep lengkap → 200 + id', async () => {
    const { token } = await createUserAndSession()
    const res = await recipePOST(token, {
      title: 'Nasi Goreng Kampung',
      description: 'Enak banget',
      ingredients: ['nasi', 'telur', 'kecap'],
      steps: ['Goreng nasi', 'Masukkan telur'],
      category: 'Lunch', time: '15 min', difficulty: 'Easy',
    })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.id).toBeDefined()
  })

  test('IT-32: tanpa title → 400', async () => {
    const { token } = await createUserAndSession()
    const res = await recipePOST(token, { ingredients: ['x'], steps: ['y'] })
    expect(res.status).toBe(400)
  })

  test('IT-33: tanpa ingredients → 400', async () => {
    const { token } = await createUserAndSession()
    const res = await recipePOST(token, { title: 'Soto', steps: ['masak'] })
    expect(res.status).toBe(400)
  })

  test('IT-34: source default "manual" jika tidak diisi', async () => {
    const { token, userId } = await createUserAndSession()
    await recipePOST(token, { title: 'Soto Ayam', ingredients: [], steps: [] })
    const saved = await db.collection('recipes').findOne({ userId, title: 'Soto Ayam' })
    expect(saved?.source).toBe('manual')
  })

  test('IT-35: tanpa sesi → 401', async () => {
    const res = await recipePOST(null, { title: 'Test', ingredients: [], steps: [] })
    expect(res.status).toBe(401)
  })
})

describe('IT: GET /api/recipes', () => {
  test('IT-36: user hanya lihat resep miliknya sendiri', async () => {
    const { token: tA, userId: uA } = await createUserAndSession('a@chillo.com')
    const { token: tB, userId: uB } = await createUserAndSession('b@chillo.com')
    await db.collection('recipes').insertMany([
      { userId: uA, title: 'Resep A1', ingredients: [], steps: [], source: 'manual', createdAt: new Date() },
      { userId: uA, title: 'Resep A2', ingredients: [], steps: [], source: 'manual', createdAt: new Date() },
      { userId: uB, title: 'Resep B1', ingredients: [], steps: [], source: 'manual', createdAt: new Date() },
    ])
    const resA = await recipeGET(tA)
    expect(resA.body.recipes).toHaveLength(2)
    const resB = await recipeGET(tB)
    expect(resB.body.recipes).toHaveLength(1)
    expect(resB.body.recipes[0].title).toBe('Resep B1')
  })

  test('IT-37: tanpa sesi → 401', async () => {
    const res = await recipeGET(null)
    expect(res.status).toBe(401)
  })
})

// ─── DELETE /api/recipes/[id] ─────────────────────────────────────────────────
describe('IT: DELETE /api/recipes/[id]', () => {
  test('IT-38: hapus milik sendiri → 200 + record terhapus', async () => {
    const { token, userId } = await createUserAndSession()
    const r = await db.collection('recipes').insertOne({
      userId, title: 'Mie Ayam', ingredients: [], steps: [], source: 'manual', createdAt: new Date(),
    })
    const res = await recipeDELETE(token, r.insertedId.toString())
    expect(res.status).toBe(200)
    expect(await db.collection('recipes').findOne({ _id: r.insertedId })).toBeNull()
  })

  test('IT-39: hapus milik user lain → 404 (IDOR), record tidak terhapus', async () => {
    const { userId: ownerId } = await createUserAndSession('recipeowner@chillo.com')
    const { token: attackerToken } = await createUserAndSession('recipeattacker@chillo.com')
    const r = await db.collection('recipes').insertOne({
      userId: ownerId, title: 'Resep Rahasia', ingredients: [], steps: [], source: 'manual', createdAt: new Date(),
    })
    const res = await recipeDELETE(attackerToken, r.insertedId.toString())
    expect(res.status).toBe(404)
    expect(await db.collection('recipes').findOne({ _id: r.insertedId })).not.toBeNull()
  })

  test('IT-40: ID tidak valid → 400', async () => {
    const { token } = await createUserAndSession()
    const res = await recipeDELETE(token, 'bukan-objectid')
    expect(res.status).toBe(400)
  })

  test('IT-41: tanpa sesi → 401', async () => {
    const res = await recipeDELETE(null, new ObjectId().toString())
    expect(res.status).toBe(401)
  })
})
