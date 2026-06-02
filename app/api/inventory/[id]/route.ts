import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'

async function getSessionUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('chillo_session')?.value
  if (!token) return null
  const sessions = await getCollection('sessions')
  const session = await sessions?.findOne({ token, expiresAt: { $gt: new Date() } })
  return session ?? null
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionUser()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { name, category, quantity, unit, purchaseDate, expirationDate, icon } = body

    const col = await getCollection('inventory')
    await col?.updateOne(
      { _id: new ObjectId(params.id), userId: session.userId },
      { $set: { name, category, quantity: Number(quantity), unit, purchaseDate, expirationDate, icon, updatedAt: new Date() } }
    )
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PUT /api/inventory/:id]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionUser()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const col = await getCollection('inventory')
    await col?.deleteOne({ _id: new ObjectId(params.id), userId: session.userId })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/inventory/:id]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
