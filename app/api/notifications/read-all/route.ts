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

export async function POST() {
  try {
    const session = await getSessionUser()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const col = await getCollection('notifications')
    await col?.updateMany(
      { userId: session.userId, read: false },
      { $set: { read: true } }
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/notifications/read-all]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}