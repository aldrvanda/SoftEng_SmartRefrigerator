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

export async function GET() {
  try {
    const session = await getSessionUser()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const users = await getCollection('users')
    const user = await users?.findOne({ _id: new ObjectId(session.userId) }, { projection: { password: 0 } })
    return NextResponse.json({ user: user ?? null })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSessionUser()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { name } = await req.json()
    if (!name || name.trim().length < 2) return NextResponse.json({ error: 'Name too short' }, { status: 400 })
    const users = await getCollection('users')
    await users?.updateOne({ _id: new ObjectId(session.userId) }, { $set: { name: name.trim(), updatedAt: new Date() } })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
