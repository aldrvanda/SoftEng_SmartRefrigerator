import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { cookies } from 'next/headers'

async function getSessionUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('chillo_session')?.value
  if (!token) return null
  const sessions = await getCollection('sessions')
  const session = await sessions?.findOne({ token, expiresAt: { $gt: new Date() } })
  return session ?? null
}

export async function GET() {
  try {
    const session = await getSessionUser()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const col = await getCollection('inventory')
    const items = await col?.find({ userId: session.userId }).sort({ expirationDate: 1 }).toArray()
    return NextResponse.json({ items: items || [] })
  } catch (err) {
    console.error('[GET /api/inventory]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { name, category, quantity, unit, purchaseDate, expirationDate, icon } = body
    if (!name || !expirationDate) return NextResponse.json({ error: 'Name and expiration date are required' }, { status: 400 })

    const col = await getCollection('inventory')
    const result = await col?.insertOne({
      userId: session.userId,
      name, category: category || 'Other',
      quantity: Number(quantity) || 0,
      unit: unit || 'pcs',
      purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
      expirationDate,
      icon: icon || '🥗',
      createdAt: new Date(),
    })
    return NextResponse.json({ success: true, id: result?.insertedId })
  } catch (err) {
    console.error('[POST /api/inventory]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
