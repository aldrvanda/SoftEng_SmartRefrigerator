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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSessionUser()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const { name, category, quantity, unit, purchaseDate, expirationDate, price } = body
    const col = await getCollection('inventory')
    await col?.updateOne(
      { _id: new ObjectId(id), userId: session.userId },
      { $set: { name, category, quantity: Number(quantity), unit, purchaseDate, expirationDate, price: price ? Number(price) : null, updatedAt: new Date() } }
    )
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PUT /api/inventory/:id]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSessionUser()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let reason = 'Used for cooking'
    try {
      const body = await req.json()
      if (body?.reason) reason = body.reason
    } catch { /* no body */ }

    const col = await getCollection('inventory')
    const item = await col?.findOne({ _id: new ObjectId(id), userId: session.userId })

    if (item) {
      const idrFactors: Record<string, number> = {
        Meat: 50000, Seafood: 60000, Dairy: 25000, Produce: 15000,
        Fruit: 20000, Vegetable: 15000, Pantry: 20000, Frozen: 30000,
        Beverages: 18000, Snacks: 15000, Other: 15000,
      }
      const estLoss = item.price
        ? Number(item.price)
        : (idrFactors[item.category] || 15000) * (Number(item.quantity) || 1)

      if (reason === 'Spoiled / Discarded') {
        // Log to waste for financial impact tracking
        const wasteCol = await getCollection('waste')
        await wasteCol?.insertOne({
          userId: session.userId,
          name: item.name,
          category: item.category,
          reason: 'Spoiled / Discarded',
          estLoss: Math.round(estLoss),
          createdAt: new Date(),
        })
      }

      // Log ALL removals for chart tracking (cooked + discarded)
      const removedCol = await getCollection('removed_items')
      await removedCol?.insertOne({
        userId: session.userId,
        name: item.name,
        category: item.category,
        reason, // 'Used for cooking' | 'Spoiled / Discarded'
        createdAt: new Date(),
      })
    }

    const result = await col?.deleteOne({ _id: new ObjectId(id), userId: session.userId })
    if (result?.deletedCount === 0) return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/inventory/:id]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
