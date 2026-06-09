import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'

async function getSessionUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('chillo_session')?.value
  if (!token) return null
  const sessions = await getCollection('sessions')
  return await sessions?.findOne({ token, expiresAt: { $gt: new Date() } }) ?? null
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSessionUser()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const col = await getCollection('recipes')
    await col?.deleteOne({ _id: new ObjectId(id), userId: session.userId })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/recipes/:id]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSessionUser()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { title, description, time, difficulty, ingredients, steps } = body

    const col = await getCollection('recipes')
    await col?.updateOne(
      { _id: new ObjectId(id), userId: session.userId },
      { $set: { title, description, time, difficulty, ingredients, steps, updatedAt: new Date() } }
    )
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PUT /api/recipes/:id]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
