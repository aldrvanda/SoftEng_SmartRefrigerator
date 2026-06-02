'use client'

import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Download, PackageOpen } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const PP = "'Poppins', sans-serif"
type Period = 'Monthly' | 'Weekly' | 'Yearly'

interface WastedItem {
  _id: string
  name: string
  category: string
  reason: string
  estLoss: number
}

const categoryBadge: Record<string, { bg: string; color: string }> = {
  Produce: { bg: '#e6eddc', color: '#3d5429' },
  Dairy:   { bg: '#e0f0ff', color: '#1e40af' },
  Pantry:  { bg: '#fef3c7', color: '#92400e' },
  Meat:    { bg: '#ffe4e4', color: '#991b1b' },
}

const categoryIcons: Record<string, string> = {
  Produce: 'https://img.icons8.com/ios/20/4f6d35/salad.png',
  Dairy:   'https://img.icons8.com/ios/20/1e40af/milk-bottle.png',
  Meat:    'https://img.icons8.com/ios/20/991b1b/steak.png',
  Pantry:  'https://img.icons8.com/ios/20/92400e/bread.png',
  Frozen:  'https://img.icons8.com/ios/20/1d4ed8/snowflake.png',
}

const PIE_COLORS = ['#4f6d35','#adc491','#f4a261','#e9c46a']

const smartTips = [
  {
    icon: 'https://img.icons8.com/ios/32/4f6d35/salad.png',
    title: 'Revive Wilted Greens',
    desc: 'Soak sad spinach or lettuce in an ice bath for 20 minutes. The cold shocks the cells, restoring their crunch before dinner.',
  },
  {
    icon: 'https://img.icons8.com/ios/32/92400e/bread.png',
    title: 'The Bread Bank',
    desc: "Don't toss stale bread. Cube it and freeze immediately. You're one step away from instant homemade croutons or savory bread pudding.",
  },
  {
    icon: 'https://img.icons8.com/ios/32/1d4ed8/snowflake.png',
    title: 'Liquid Gold (Broth)',
    desc: 'Keep a bag in the freezer for vegetable scraps (onion skins, carrot peels). Boil them down weekly for a free, rich vegetable stock.',
  },
]

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>('Monthly')
  const [wastedItems, setWastedItems] = useState<WastedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/waste')
      .then(r => r.json())
      .then(data => setWastedItems(data.items || []))
      .catch(() => setWastedItems([]))
      .finally(() => setLoading(false))
  }, [])

  const totalLoss = wastedItems.reduce((sum, i) => sum + (i.estLoss || 0), 0)

  const categoryMap: Record<string, number> = {}
  wastedItems.forEach(item => {
    categoryMap[item.category] = (categoryMap[item.category] || 0) + 1
  })
  const total = wastedItems.length || 1
  const pieData = Object.entries(categoryMap).map(([name, count]) => ({
    name, value: Math.round((count / total) * 100),
  }))

  const kitchenScore = Math.max(0, 100 - wastedItems.length * 5)

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 animate-slide-up">
        <div>
          <h1 style={{ fontFamily: PP, fontSize: '1.75rem', fontWeight: 700, color: '#1a1a14', marginBottom: '4px' }}>
            Waste Analytics
          </h1>
          <p style={{ fontFamily: PP, fontSize: '13px', color: '#8a8070' }}>
            Track, analyze, and minimize your kitchen footprint.
          </p>
        </div>
        <div className="flex rounded-xl overflow-hidden"
          style={{ borderWidth: '1.5px', borderStyle: 'solid', borderColor: '#e0dbc8', background: 'white' }}>
          {(['Monthly','Weekly','Yearly'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className="px-5 py-2 transition-all"
              style={{ fontFamily: PP, fontSize: '13px', fontWeight: period === p ? 600 : 400, background: period === p ? '#3d5429' : 'transparent', color: period === p ? 'white' : '#6b6356' }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {/* Financial Impact */}
        <div className="rounded-2xl p-5 animate-slide-up stagger-1" style={{ background: 'white', border: '1px solid #e0dbc8' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <img src="https://img.icons8.com/ios/18/dc2626/money-bag.png" alt="" width={18} height={18} />
              <span style={{ fontFamily: PP, fontSize: '10px', fontWeight: 600, color: '#dc2626', letterSpacing: '0.08em' }}>
                FINANCIAL IMPACT
              </span>
            </div>
            {wastedItems.length > 0 && (
              <span className="px-2 py-0.5 rounded-full"
                style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, background: '#fee2e2', color: '#dc2626' }}>
                {wastedItems.length} items
              </span>
            )}
          </div>
          <p style={{ fontFamily: PP, fontSize: '2rem', fontWeight: 700, color: '#1a1a14', lineHeight: 1, marginBottom: '4px' }}>
            ${totalLoss.toFixed(2)}
          </p>
          <p style={{ fontFamily: PP, fontSize: '12px', color: '#9a9585' }}>Estimated value of discarded ingredients.</p>
        </div>

        {/* Items Wasted */}
        <div className="rounded-2xl p-5 animate-slide-up stagger-2" style={{ background: 'white', border: '1px solid #e0dbc8' }}>
          <div className="flex items-center gap-2 mb-3">
            <img src="https://img.icons8.com/ios/18/9a9585/scales.png" alt="" width={18} height={18} />
            <span style={{ fontFamily: PP, fontSize: '10px', fontWeight: 600, color: '#9a9585', letterSpacing: '0.08em' }}>
              ITEMS WASTED
            </span>
          </div>
          <p style={{ fontFamily: PP, fontSize: '2rem', fontWeight: 700, color: '#1a1a14', lineHeight: 1, marginBottom: '4px' }}>
            {loading ? '—' : wastedItems.length}
          </p>
          <p style={{ fontFamily: PP, fontSize: '12px', color: '#9a9585' }}>Total items discarded this period.</p>
        </div>

        {/* Kitchen Score */}
        <div className="rounded-2xl p-5 animate-slide-up stagger-3" style={{ background: '#3d5429', color: 'white' }}>
          <div className="flex items-center gap-2 mb-3">
            <img src="https://img.icons8.com/ios/18/ffffff/prize.png" alt="" width={18} height={18} />
            <span style={{ fontFamily: PP, fontSize: '10px', fontWeight: 600, opacity: 0.7, letterSpacing: '0.08em' }}>
              KITCHEN SCORE
            </span>
          </div>
          <p style={{ fontFamily: PP, fontSize: '2rem', fontWeight: 700, lineHeight: 1, marginBottom: '8px' }}>
            {kitchenScore}<span style={{ fontSize: '1.1rem', fontWeight: 400, opacity: 0.6 }}>/100</span>
          </p>
          <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <div className="h-full rounded-full" style={{ width: `${kitchenScore}%`, background: 'white' }} />
          </div>
        </div>
      </div>

      {/* Chart + Log */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Donut */}
        <div className="rounded-2xl p-6 animate-slide-up stagger-1" style={{ background: 'white', border: '1px solid #e0dbc8' }}>
          <h3 style={{ fontFamily: PP, fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Waste by Category</h3>
          {wastedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <PackageOpen size={36} style={{ color: '#c8c0b0' }} />
              <p style={{ fontFamily: PP, fontSize: '13px', color: '#9a9080' }}>No waste data yet — great job!</p>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <div className="relative flex-shrink-0" style={{ width: 160, height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                      {pieData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v}%`, '']} contentStyle={{ fontSize: 12, borderRadius: 8, fontFamily: PP }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ pointerEvents: 'none' }}>
                  <p style={{ fontFamily: PP, fontSize: '1.5rem', fontWeight: 700 }}>{pieData.length}</p>
                  <p style={{ fontFamily: PP, fontSize: '11px', color: '#9a9585' }}>Categories</p>
                </div>
              </div>
              <div className="space-y-2 flex-1">
                {pieData.map((cat, idx) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                      <span style={{ fontFamily: PP, fontSize: '13px', color: '#4a4030' }}>{cat.name}</span>
                    </div>
                    <span style={{ fontFamily: PP, fontSize: '13px', fontWeight: 600 }}>{cat.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Wasted Items Log */}
        <div className="rounded-2xl p-6 animate-slide-up stagger-2" style={{ background: 'white', border: '1px solid #e0dbc8' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontFamily: PP, fontSize: '15px', fontWeight: 600 }}>Wasted Items Log</h3>
            <button className="flex items-center gap-1.5 hover:underline"
              style={{ fontFamily: PP, fontSize: '12px', fontWeight: 500, color: '#3d5429' }}>
              <Download size={13} /> Export
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="animate-pulse rounded-xl" style={{ background: '#f0ece0', height: '40px' }} />)}
            </div>
          ) : wastedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <PackageOpen size={32} style={{ color: '#c8c0b0' }} />
              <p style={{ fontFamily: PP, fontSize: '13px', color: '#9a9080' }}>No wasted items recorded yet.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #f0ece0' }}>
                  {['Item','Category','Reason','Est. Loss'].map(h => (
                    <th key={h} className="text-left pb-2"
                      style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#9a9585', letterSpacing: '0.04em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {wastedItems.map((item, i) => (
                  <tr key={String(item._id)} style={{ borderBottom: i < wastedItems.length - 1 ? '1px solid #f0ece0' : 'none' }}>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: categoryBadge[item.category]?.bg || '#f0ece0' }}>
                          <img src={categoryIcons[item.category] || categoryIcons.Produce} alt="" width={16} height={16} />
                        </div>
                        <span style={{ fontFamily: PP, fontSize: '13px', fontWeight: 500 }}>{item.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded-full"
                        style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, background: categoryBadge[item.category]?.bg || '#f0ece0', color: categoryBadge[item.category]?.color || '#6b6356' }}>
                        {item.category?.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5" style={{ fontFamily: PP, fontSize: '12px', color: '#6b6356' }}>{item.reason}</td>
                    <td className="py-2.5" style={{ fontFamily: PP, fontSize: '13px', fontWeight: 600 }}>${(item.estLoss || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Smart Tips */}
      <div className="animate-slide-up stagger-3">
        <div className="flex items-center gap-2 mb-4">
          <img src="https://img.icons8.com/ios/18/3d5429/idea.png" alt="" width={18} height={18} />
          <h3 style={{ fontFamily: PP, fontSize: '15px', fontWeight: 600 }}>Smart Recovery Tips</h3>
        </div>
        <div className="grid grid-cols-3 gap-5">
          {smartTips.map((tip, i) => (
            <div key={tip.title} className={`rounded-2xl p-5 animate-slide-up stagger-${i+4}`}
              style={{ background: 'white', border: '1px solid #e0dbc8' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'var(--color-cream)' }}>
                <img src={tip.icon} alt="" width={24} height={24} />
              </div>
              <h4 style={{ fontFamily: PP, fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>{tip.title}</h4>
              <p style={{ fontFamily: PP, fontSize: '12px', color: '#6b6356', lineHeight: 1.6 }}>{tip.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}