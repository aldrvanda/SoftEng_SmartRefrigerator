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

// GET: fetch all saved recipes for user
export async function GET() {
  try {
    const session = await getSessionUser()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const col = await getCollection('recipes')
    const recipes = await col?.find({ userId: session.userId }).sort({ createdAt: -1 }).toArray() || []
    return NextResponse.json({ recipes })
  } catch (err) {
    console.error('[GET /api/recipes]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST: save a recipe (manual or AI-generated)
export async function POST(req: Request) {
  try {
    const session = await getSessionUser()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { title, description, time, difficulty, tag, tagType, image, ingredients, steps, matchPercent, source } = body

    if (!title || !ingredients || !steps) {
      return NextResponse.json({ error: 'Title, ingredients, and steps are required' }, { status: 400 })
    }

    const col = await getCollection('recipes')
    const result = await col?.insertOne({
      userId: session.userId,
      title,
      description: description || '',
      time: time || '30 min',
      difficulty: difficulty || 'Easy',
      tag: tag || null,
      tagType: tagType || null,
      image: image || null,
      ingredients: Array.isArray(ingredients) ? ingredients : [ingredients],
      steps: Array.isArray(steps) ? steps : [steps],
      matchPercent: matchPercent || 0,
      source: source || 'manual', // 'manual' | 'ai'
      createdAt: new Date(),
    })
    return NextResponse.json({ success: true, id: result?.insertedId })
  } catch (err) {
    console.error('[POST /api/recipes]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
