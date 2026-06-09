import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { cookies } from 'next/headers'

async function getSessionUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('chillo_session')?.value
  if (!token) return null
  const sessions = await getCollection('sessions')
  return await sessions?.findOne({ token, expiresAt: { $gt: new Date() } }) ?? null
}

// Returns today's date as "YYYY-MM-DD" in WIB (Asia/Jakarta, UTC+7).
// Vercel servers run UTC — Intl.DateTimeFormat is the correct, DST-safe fix.
function getTodayStr(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date())
}

// Computes calendar-day difference — pure integer math, no timezone issues.
// Positive = future (not expired), 0 = expires today, negative = already expired.
function calcDaysLeft(expirationDateStr: string, todayStr: string): number {
  const [ey, em, ed] = String(expirationDateStr).split('-').map(Number)
  const [ty, tm, td] = todayStr.split('-').map(Number)
  const expMs = Date.UTC(ey, em - 1, ed)
  const todMs = Date.UTC(ty, tm - 1, td)
  return Math.round((expMs - todMs) / (1000 * 60 * 60 * 24))
}

export async function GET() {
  try {
    const session = await getSessionUser()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const inventoryCol = await getCollection('inventory')
    const items = await inventoryCol?.find({ userId: session.userId }).toArray() || []

    // todayStr is WIB-correct regardless of server timezone (Vercel = UTC)
    const todayStr = getTodayStr()
    const notifCol = await getCollection('notifications')

    // Upsert auto-notifications — preserves existing read state via $setOnInsert
    for (const item of items) {
      const daysLeft = calcDaysLeft(item.expirationDate, todayStr)
      const autoId = `auto_${item._id}`

      if (daysLeft < 0) {
        // Already expired
        await notifCol?.updateOne(
          { _id: autoId, userId: session.userId },
          {
            $setOnInsert: { read: false, createdAt: new Date() },
            $set: {
              type: 'expired',
              title: `${item.name} has expired`,
              body: 'Remove this item from your inventory.',
              icon: 'warning',
              userId: session.userId,
            },
          },
          { upsert: true }
        )
      } else if (daysLeft <= 3) {
        // Expiring soon — threshold matches dashboard (d <= 3)
        const when =
          daysLeft === 0 ? 'today' :
          daysLeft === 1 ? 'tomorrow' :
          `in ${daysLeft} days`
        await notifCol?.updateOne(
          { _id: autoId, userId: session.userId },
          {
            $setOnInsert: { read: false, createdAt: new Date() },
            $set: {
              type: 'almost',
              title: `${item.name} expires ${when}`,
              body: 'Use it soon or find a recipe to avoid waste.',
              icon: 'clock',
              userId: session.userId,
            },
          },
          { upsert: true }
        )
      } else {
        // Item is safe — clean up its notification if it exists
        await notifCol?.deleteOne({ _id: autoId, userId: session.userId })
      }
    }

    // Also clean up notifications for deleted inventory items
    const itemIds = new Set(items.map(i => `auto_${i._id}`))
    const allAutoNotifs = await notifCol?.find({ _id: { $regex: '^auto_' }, userId: session.userId }).toArray() || []
    for (const n of allAutoNotifs) {
      if (!itemIds.has(String(n._id))) {
        await notifCol?.deleteOne({ _id: n._id, userId: session.userId })
      }
    }

    const all = await notifCol?.find({ userId: session.userId }).sort({ createdAt: -1 }).limit(50).toArray() || []
    return NextResponse.json({ notifications: all })
  } catch (err) {
    console.error('[GET /api/notifications]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// Mark single notification as read
export async function PATCH(req: Request) {
  try {
    const session = await getSessionUser()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await req.json()
    const col = await getCollection('notifications')
    await col?.updateOne({ _id: id, userId: session.userId }, { $set: { read: true } })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}