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

// Shared helper — parses "YYYY-MM-DD" as local date (no timezone shift)
function parseDateLocal(dateStr: string): Date {
  const parts = String(dateStr).split('-')
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
}

// Matches dashboard: d < 0 → expired, d <= 3 → almost, else safe
function calcDaysLeft(dateStr: string, now: Date): number {
  const exp = parseDateLocal(dateStr)
  return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export async function GET() {
  try {
    const session = await getSessionUser()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const inventoryCol = await getCollection('inventory')
    const items = await inventoryCol?.find({ userId: session.userId }).toArray() || []

    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const notifCol = await getCollection('notifications')

    // Upsert auto-notifications — preserves existing read state via $setOnInsert
    for (const item of items) {
      const daysLeft = calcDaysLeft(item.expirationDate, now)
      const autoId = `auto_${item._id}`

      if (daysLeft < 0) {
        // Already expired
        await notifCol?.updateOne(
          { _id: autoId, userId: session.userId },
          {
            $setOnInsert: { read: false, createdAt: now },
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
            $setOnInsert: { read: false, createdAt: now },
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