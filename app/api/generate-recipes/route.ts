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

    // Fetch user's inventory
    const inventoryCol = await getCollection('inventory')
    const items = await inventoryCol?.find({ userId: session.userId }).toArray() || []

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'Inventaris kosong. Tambah item dulu sebelum generate resep.' },
        { status: 400 }
      )
    }

    // Sort by soonest expiry
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const sorted = [...items].sort((a, b) =>
      new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()
    )

    // Build ingredient list with days left info
    const ingredientList = sorted
      .slice(0, 10)
      .map(i => {
        const parts = String(i.expirationDate).split('-')
        const exp = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
        const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        const urgency = daysLeft < 0 ? 'EXPIRED' : daysLeft === 0 ? 'expires TODAY' : daysLeft <= 3 ? `expires in ${daysLeft}d` : `${daysLeft}d left`
        return `${i.name} (${i.category}, ${urgency})`
      })
      .join(', ')

    // Get API key
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Konfigurasi API key belum diset. Tambahkan ANTHROPIC_API_KEY=sk-ant-... ke file .env.local di root project, lalu restart server.' },
        { status: 500 }
      )
    }

    // Call Anthropic from server side
    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: `Kamu adalah asisten chef rumahan. Berdasarkan bahan-bahan di kulkas ini (urut dari yang paling cepat kadaluarsa): ${ingredientList}

Buat tepat 3 saran resep. Balas HANYA dengan JSON array yang valid, tanpa markdown, tanpa penjelasan apapun:
[
  {
    "title": "Nama Resep",
    "description": "Satu kalimat deskripsi singkat",
    "time": "X menit",
    "difficulty": "Mudah",
    "tag": "Segera habiskan: NamaBahan",
    "tagType": "urgent",
    "ingredients": ["bahan1", "bahan2", "bahan3"],
    "steps": ["Langkah 1.", "Langkah 2.", "Langkah 3."],
    "matchPercent": 85
  }
]

Difficulty harus salah satu dari: Mudah, Sedang, Susah.
Prioritaskan bahan yang paling cepat kadaluarsa.`,
          },
        ],
      }),
    })

    if (!aiResponse.ok) {
      const errText = await aiResponse.text().catch(() => 'Unknown error')
      console.error('[generate-recipes] Anthropic error:', aiResponse.status, errText)
      return NextResponse.json(
        { error: `Anthropic API error ${aiResponse.status}. Pastikan API key valid.` },
        { status: 500 }
      )
    }

    const aiData = await aiResponse.json()
    const rawText: string = (aiData.content || [])
      .map((c: any) => c.type === 'text' ? c.text : '')
      .join('')

    // Strip any accidental markdown fences
    const clean = rawText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    let parsed: any[]
    try {
      parsed = JSON.parse(clean)
      if (!Array.isArray(parsed)) throw new Error('Not an array')
    } catch (e) {
      console.error('[generate-recipes] Parse error. Raw response:', clean)
      return NextResponse.json({ error: 'Gagal memproses respons AI. Coba lagi.' }, { status: 500 })
    }

    // Save to DB
    const recipesCol = await getCollection('recipes')
    const saved = []
    for (const r of parsed) {
      if (!r.title) continue
      const result = await recipesCol?.insertOne({
        userId: session.userId,
        title: r.title,
        description: r.description || '',
        time: r.time || '30 menit',
        difficulty: r.difficulty || 'Mudah',
        tag: r.tag || null,
        tagType: r.tagType || null,
        image: null,
        ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
        steps: Array.isArray(r.steps) ? r.steps : [],
        matchPercent: Number(r.matchPercent) || 0,
        source: 'ai',
        createdAt: new Date(),
      })
      saved.push({
        ...r,
        _id: result?.insertedId?.toString(),
        source: 'ai',
      })
    }

    return NextResponse.json({ recipes: saved })
  } catch (err) {
    console.error('[POST /api/generate-recipes]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
