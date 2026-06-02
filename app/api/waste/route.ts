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
    const col = await getCollection('waste')
    const items = await col?.find({ userId: session.userId }).sort({ createdAt: -1 }).toArray()
    return NextResponse.json({ items: items || [] })
  } catch (err) {
    console.error('[GET /api/waste]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const col = await getCollection('waste')
    const result = await col?.insertOne({ ...body, userId: session.userId, createdAt: new Date() })
    return NextResponse.json({ success: true, id: result?.insertedId })
  } catch (err) {
    console.error('[POST /api/waste]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
