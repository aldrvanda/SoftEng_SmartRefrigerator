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

function getPeriodStart(period: string): Date {
  const now = new Date(); now.setHours(0, 0, 0, 0)
  if (period === 'Daily') { const d = new Date(now); d.setDate(d.getDate() - 6); return d }
  if (period === 'Weekly') { const d = new Date(now); d.setDate(d.getDate() - 27); return d }
  const d = new Date(now); d.setMonth(d.getMonth() - 5); d.setDate(1); return d
}

function getBuckets(period: string): { key: string; label: string }[] {
  const now = new Date()
  if (period === 'Daily') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now); d.setDate(d.getDate() - (6 - i))
      return { key: d.toISOString().split('T')[0], label: d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }) }
    })
  }
  if (period === 'Weekly') {
    return Array.from({ length: 4 }, (_, i) => {
      const ws = new Date(now); ws.setDate(ws.getDate() - (3 - i) * 7)
      return { key: `week_${i}`, label: `${ws.getDate()} ${ws.toLocaleDateString('id-ID', { month: 'short' })}` }
    })
  }
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now); d.setMonth(d.getMonth() - (5 - i))
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('id-ID', { month: 'short' }) }
  })
}

function getItemBucket(date: Date, period: string, buckets: { key: string; label: string }[]): string | null {
  if (period === 'Daily') { const k = date.toISOString().split('T')[0]; return buckets.find(b => b.key === k)?.key ?? null }
  if (period === 'Weekly') {
    const now = new Date(); now.setHours(0, 0, 0, 0)
    for (let i = 0; i < 4; i++) {
      const we = new Date(now); we.setDate(we.getDate() - (3 - i) * 7 + 6)
      const ws = new Date(we); ws.setDate(ws.getDate() - 6)
      if (date >= ws && date <= we) return `week_${i}`
    }
    return null
  }
  const k = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  return buckets.find(b => b.key === k)?.key ?? null
}

export async function GET(req: Request) {
  try {
    const session = await getSessionUser()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || 'Monthly'
    const periodStart = getPeriodStart(period)
    const buckets = getBuckets(period)

    const inventoryCol = await getCollection('inventory')
    const allInventory = await inventoryCol?.find({ userId: session.userId }).toArray() || []
    const now = new Date(); now.setHours(0, 0, 0, 0)

    const safeItems    = allInventory.filter(i => { const d = Math.ceil((new Date(i.expirationDate).getTime() - now.getTime()) / 86400000); return d > 2 })
    const almostItems  = allInventory.filter(i => { const d = Math.ceil((new Date(i.expirationDate).getTime() - now.getTime()) / 86400000); return d >= 0 && d <= 2 })
    const expiredItems = allInventory.filter(i => new Date(i.expirationDate) < now)
    const urgentItems  = almostItems.slice(0, 5).map(i => i.name)

    // Category health breakdown — for stacked bar insight chart
    const catHealthMap: Record<string, { safe: number; expiring: number; expired: number }> = {}
    allInventory.forEach(item => {
      const cat = item.category || 'Other'
      if (!catHealthMap[cat]) catHealthMap[cat] = { safe: 0, expiring: 0, expired: 0 }
      const d = Math.ceil((new Date(item.expirationDate).getTime() - now.getTime()) / 86400000)
      if (d < 0) catHealthMap[cat].expired++
      else if (d <= 2) catHealthMap[cat].expiring++
      else catHealthMap[cat].safe++
    })
    const categoryHealth = Object.entries(catHealthMap)
      .map(([name, counts]) => ({ name, ...counts, total: counts.safe + counts.expiring + counts.expired }))
      .sort((a, b) => (b.expiring + b.expired) - (a.expiring + a.expired))
      .slice(0, 6)

    const wasteCol = await getCollection('waste')
    const wastedItems = await wasteCol?.find({ userId: session.userId, createdAt: { $gte: periodStart } }).sort({ createdAt: -1 }).toArray() || []
    const totalLoss = wastedItems.reduce((s: number, i: any) => s + (i.estLoss || 0), 0)

    const catMap: Record<string, number> = {}
    wastedItems.forEach((i: any) => { catMap[i.category] = (catMap[i.category] || 0) + 1 })
    const wasteTotal = wastedItems.length || 1
    const pieData = Object.entries(catMap).map(([name, count]) => ({ name, value: Math.round((count / wasteTotal) * 100), count }))

    const removedCol = await getCollection('removed_items')
    const removedItems = await removedCol?.find({ userId: session.userId, createdAt: { $gte: periodStart } }).toArray() || []

    const trendMap: Record<string, { label: string; cooked: number; discarded: number }> = {}
    buckets.forEach(b => { trendMap[b.key] = { label: b.label, cooked: 0, discarded: 0 } })
    removedItems.forEach((item: any) => {
      const key = getItemBucket(new Date(item.createdAt), period, buckets)
      if (key && trendMap[key]) {
        if (item.reason === 'Spoiled / Discarded') trendMap[key].discarded++
        else trendMap[key].cooked++
      }
    })
    const trendData = buckets.map(b => trendMap[b.key])

    const score = allInventory.length === 0 ? 100
      : Math.max(0, Math.round(100 - (expiredItems.length / allInventory.length) * 50 - wastedItems.length * 3))

    return NextResponse.json({
      period,
      inventory: { total: allInventory.length, safe: safeItems.length, almostExpired: almostItems.length, expired: expiredItems.length, urgentItems },
      waste: { items: wastedItems, totalLoss: Math.round(totalLoss), count: wastedItems.length, pieData },
      trend: trendData,
      categoryHealth,
      kitchenScore: score,
    })
  } catch (err) {
    console.error('[GET /api/reports]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
