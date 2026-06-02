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

export async function GET() {
  try {
    const session = await getSessionUser()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Auto-generate notifications from inventory
    const inventoryCol = await getCollection('inventory')
    const items = await inventoryCol?.find({ userId: session.userId }).toArray() || []

    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const autoNotifs = items
      .map(item => {
        const exp = new Date(item.expirationDate)
        const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        if (daysLeft < 0) return { _id: `auto_${item._id}`, type: 'expired', title: `${item.name} has expired`, body: 'Remove or replace this item from your inventory.', icon: 'warning', read: false, createdAt: new Date(), userId: session.userId }
        if (daysLeft <= 2) return { _id: `auto_${item._id}`, type: 'almost', title: `${item.name} expires ${daysLeft === 0 ? 'today' : daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`}`, body: 'Use it soon or find a recipe to avoid waste.', icon: 'clock', read: false, createdAt: new Date(), userId: session.userId }
        return null
      })
      .filter(Boolean)

    // Get manual/stored notifications
    const notifCol = await getCollection('notifications')
    const stored = await notifCol?.find({ userId: session.userId }).sort({ createdAt: -1 }).limit(20).toArray() || []

    const all = [...autoNotifs, ...stored].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ notifications: all })
  } catch (err) {
    console.error('[GET /api/notifications]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

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
