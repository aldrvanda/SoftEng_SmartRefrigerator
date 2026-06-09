'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { PackageOpen, Download } from 'lucide-react'

const PP = "'Poppins', sans-serif"
type Period = 'Daily' | 'Weekly' | 'Monthly'

const PIE_COLORS = ['#3d5429', '#6b8f4a', '#adc491', '#d4e6c0', '#e8f4e0', '#b5c9a0']

const categoryIcons: Record<string, string> = {
  Fruit:'https://img.icons8.com/ios/18/e55722/apple.png', Vegetable:'https://img.icons8.com/ios/18/4f6d35/salad.png',
  Dairy:'https://img.icons8.com/ios/18/1e40af/milk-bottle.png', Meat:'https://img.icons8.com/ios/18/991b1b/steak.png',
  Seafood:'https://img.icons8.com/ios/18/0369a1/fish.png', Pantry:'https://img.icons8.com/ios/18/92400e/bread.png',
  Frozen:'https://img.icons8.com/ios/18/1d4ed8/snowflake.png', Beverages:'https://img.icons8.com/ios/18/6d28d9/water-bottle.png',
  Snacks:'https://img.icons8.com/ios/18/b45309/cookie.png', Other:'https://img.icons8.com/ios/18/6b6356/ingredients.png',
  Produce:'https://img.icons8.com/ios/18/4f6d35/salad.png',
}
const categoryBadge: Record<string, { bg: string; color: string }> = {
  Fruit:{bg:'#fde8d8',color:'#b45309'}, Vegetable:{bg:'#e6eddc',color:'#3d5429'},
  Dairy:{bg:'#e0f0ff',color:'#1e40af'}, Meat:{bg:'#ffe4e4',color:'#991b1b'},
  Seafood:{bg:'#e0f4f8',color:'#0369a1'}, Pantry:{bg:'#fef3c7',color:'#92400e'},
  Frozen:{bg:'#e8f4fd',color:'#1d4ed8'}, Beverages:{bg:'#f0e8ff',color:'#6d28d9'},
  Snacks:{bg:'#fff4e0',color:'#b45309'}, Other:{bg:'#f0ece0',color:'#6b6356'},
  Produce:{bg:'#e6eddc',color:'#3d5429'},
}

function formatIDR(n: number) {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID')
}

interface ReportData {
  inventory: { total: number; safe: number; almostExpired: number; expired: number; urgentItems: string[] }
  waste: { items: any[]; totalLoss: number; count: number; pieData: { name: string; value: number }[] }
  trend: { label: string; cooked: number; discarded: number }[]
  kitchenScore: number
}

const PERIOD_LABELS: Record<Period, string> = { Daily: 'Harian', Weekly: 'Mingguan', Monthly: 'Bulanan' }

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>('Monthly')
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchReport = useCallback((p: Period) => {
    setLoading(true)
    fetch(`/api/reports?period=${p}`).then(r => r.json()).then(d => setData(d)).catch(() => setData(null)).finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchReport(period) }, [period, fetchReport])

  const wastedItems = data?.waste?.items || []
  const totalLoss = data?.waste?.totalLoss || 0
  const kitchenScore = data?.kitchenScore ?? 100
  const pieData = data?.waste?.pieData || []
  const trendData = data?.trend || []
  const urgentItems = data?.inventory?.urgentItems || []

  const handleExport = () => {
    if (!wastedItems.length) return
    const csv = 'Item,Category,Est. Loss (IDR)\n' + wastedItems.map((i: any) => `"${i.name}","${i.category}","${Math.round(i.estLoss || 0)}"`).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `chillo-report-${period.toLowerCase()}.csv`; a.click()
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8 animate-slide-up">
        <div>
          <h1 style={{ fontFamily: PP, fontSize: 'clamp(1.3rem,5vw,1.75rem)', fontWeight: 700, color: '#1a1a14', marginBottom: '4px' }}>Waste Analytics</h1>
          <p style={{ fontFamily: PP, fontSize: '13px', color: '#8a8070' }}>Pantau dan kurangi pemborosan bahan makananmu.</p>
        </div>
        <div className="flex rounded-xl overflow-hidden flex-shrink-0" style={{ borderWidth: '1.5px', borderStyle: 'solid', borderColor: '#e0dbc8', background: 'white' }}>
          {(['Daily', 'Weekly', 'Monthly'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ fontFamily: PP, fontSize: '13px', fontWeight: period === p ? 600 : 400, background: period === p ? '#3d5429' : 'transparent', color: period === p ? 'white' : '#6b6356', padding: '8px 16px', border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}>
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Snapshot */}
      {!loading && data && (
        <div className="rounded-2xl p-5 mb-6 animate-slide-up" style={{ background: '#f4f7f0', borderWidth: '1.5px', borderStyle: 'solid', borderColor: '#cddcba' }}>
          <div className="flex items-center gap-2 mb-3">
            <img src="https://img.icons8.com/ios/16/3d5429/box--v1.png" alt="" width={16} height={16} />
            <span style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#3d5429', letterSpacing: '0.08em' }}>INVENTORY SNAPSHOT</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Items', value: data.inventory.total, color: '#1a1a14' },
              { label: 'Safe', value: data.inventory.safe, color: '#3d5429' },
              { label: 'Expiring Soon', value: data.inventory.almostExpired, color: '#d97706' },
              { label: 'Expired', value: data.inventory.expired, color: '#dc2626' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p style={{ fontFamily: PP, fontSize: 'clamp(1.2rem,4vw,1.5rem)', fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</p>
                <p style={{ fontFamily: PP, fontSize: '11px', color: '#8a8070', marginTop: '4px' }}>{stat.label}</p>
              </div>
            ))}
          </div>
          {urgentItems.length > 0 && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid #cddcba' }}>
              <p style={{ fontFamily: PP, fontSize: '12px', color: '#3d5429' }}><strong>Segera gunakan:</strong> {urgentItems.join(', ')}</p>
            </div>
          )}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl p-5 animate-slide-up stagger-1" style={{ background: 'white', border: '1px solid #e0dbc8' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <img src="https://img.icons8.com/ios/18/dc2626/money-bag.png" alt="" width={18} height={18} />
              <span style={{ fontFamily: PP, fontSize: '10px', fontWeight: 600, color: '#dc2626', letterSpacing: '0.08em' }}>FINANCIAL IMPACT</span>
            </div>
            {wastedItems.length > 0 && <span className="px-2 py-0.5 rounded-full" style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, background: '#fee2e2', color: '#dc2626' }}>{wastedItems.length} item</span>}
          </div>
          <p style={{ fontFamily: PP, fontSize: 'clamp(1.1rem,4vw,1.5rem)', fontWeight: 700, color: '#1a1a14', lineHeight: 1, marginBottom: '4px' }}>{loading ? '—' : formatIDR(totalLoss)}</p>
          <p style={{ fontFamily: PP, fontSize: '12px', color: '#9a9585' }}>Estimasi nilai bahan yang dibuang.</p>
        </div>

        <div className="rounded-2xl p-5 animate-slide-up stagger-2" style={{ background: 'white', border: '1px solid #e0dbc8' }}>
          <div className="flex items-center gap-2 mb-3">
            <img src="https://img.icons8.com/ios/18/9a9585/scales.png" alt="" width={18} height={18} />
            <span style={{ fontFamily: PP, fontSize: '10px', fontWeight: 600, color: '#9a9585', letterSpacing: '0.08em' }}>ITEMS WASTED</span>
          </div>
          <p style={{ fontFamily: PP, fontSize: 'clamp(1.5rem,5vw,2rem)', fontWeight: 700, color: '#1a1a14', lineHeight: 1, marginBottom: '4px' }}>{loading ? '—' : wastedItems.length}</p>
          <p style={{ fontFamily: PP, fontSize: '12px', color: '#9a9585' }}>Item dibuang {period === 'Daily' ? '7 hari terakhir' : period === 'Weekly' ? '4 minggu terakhir' : '6 bulan terakhir'}.</p>
        </div>

        <div className="rounded-2xl p-5 animate-slide-up stagger-3" style={{ background: '#3d5429', color: 'white' }}>
          <div className="flex items-center gap-2 mb-3">
            <img src="https://img.icons8.com/ios/18/ffffff/prize.png" alt="" width={18} height={18} />
            <span style={{ fontFamily: PP, fontSize: '10px', fontWeight: 600, opacity: 0.7, letterSpacing: '0.08em' }}>KITCHEN SCORE</span>
          </div>
          <p style={{ fontFamily: PP, fontSize: 'clamp(1.5rem,5vw,2rem)', fontWeight: 700, lineHeight: 1, marginBottom: '8px' }}>
            {loading ? '—' : kitchenScore}<span style={{ fontSize: '1.1rem', fontWeight: 400, opacity: 0.6 }}>/100</span>
          </p>
          <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${kitchenScore}%`, background: 'white' }} />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Donut */}
        <div className="rounded-2xl p-5 sm:p-6 animate-slide-up stagger-1" style={{ background: 'white', border: '1px solid #e0dbc8' }}>
          <h3 style={{ fontFamily: PP, fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Waste by Category</h3>
          {loading ? (
            <div className="flex items-center justify-center h-36"><div className="animate-pulse rounded-full" style={{ width: 100, height: 100, background: '#f0ece0' }} /></div>
          ) : pieData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3"><PackageOpen size={32} style={{ color: '#c8c0b0' }} /><p style={{ fontFamily: PP, fontSize: '13px', color: '#9a9080' }}>Belum ada data pemborosan.</p></div>
          ) : (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-shrink-0" style={{ width: 130, height: 130 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value">
                      {pieData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v}%`, '']} contentStyle={{ fontSize: 11, borderRadius: 8, fontFamily: PP }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ pointerEvents: 'none' }}>
                  <p style={{ fontFamily: PP, fontSize: '1.3rem', fontWeight: 700 }}>{pieData.length}</p>
                  <p style={{ fontFamily: PP, fontSize: '10px', color: '#9a9585' }}>Categories</p>
                </div>
              </div>
              <div className="space-y-2 flex-1 min-w-0">
                {pieData.map((cat, idx) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                      <span style={{ fontFamily: PP, fontSize: '12px', color: '#4a4030' }} className="truncate">{cat.name}</span>
                    </div>
                    <span style={{ fontFamily: PP, fontSize: '12px', fontWeight: 600, flexShrink: 0, marginLeft: '8px' }}>{cat.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bar chart */}
        <div className="rounded-2xl p-5 sm:p-6 animate-slide-up stagger-2" style={{ background: 'white', border: '1px solid #e0dbc8' }}>
          <h3 style={{ fontFamily: PP, fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Items Removed</h3>
          <p style={{ fontFamily: PP, fontSize: '12px', color: '#8a8070', marginBottom: '16px' }}>Dimasak vs dibuang per periode.</p>
          {loading ? (
            <div className="flex items-end gap-2 h-36 px-4">{[40,70,50,80,60].map((h,i)=><div key={i} className="flex-1 rounded animate-pulse" style={{ height:`${h}%`, background:'#f0ece0' }} />)}</div>
          ) : (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={trendData} barGap={3} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ece0" />
                <XAxis dataKey="label" tick={{ fontFamily: PP, fontSize: 10, fill: '#9a9585' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontFamily: PP, fontSize: 10, fill: '#9a9585' }} axisLine={false} tickLine={false} width={22} />
                <Tooltip contentStyle={{ borderRadius: 10, fontFamily: PP, fontSize: 11, border: '1px solid #e0dbc8' }} cursor={{ fill: '#f0ece0', radius: 4 }} />
                <Legend wrapperStyle={{ fontFamily: PP, fontSize: 11, paddingTop: '6px' }} />
                <Bar dataKey="cooked" name="Cooked" fill="#adc491" radius={[4,4,0,0]} />
                <Bar dataKey="discarded" name="Discarded" fill="#dc2626" radius={[4,4,0,0]} opacity={0.75} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Waste Log */}
      <div className="rounded-2xl p-5 sm:p-6 animate-slide-up stagger-3" style={{ background: 'white', border: '1px solid #e0dbc8' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 style={{ fontFamily: PP, fontSize: '15px', fontWeight: 600 }}>Waste Log</h3>
            <p style={{ fontFamily: PP, fontSize: '12px', color: '#8a8070', marginTop: '2px' }}>Item yang dibuang karena basi.</p>
          </div>
          <button onClick={handleExport} disabled={!wastedItems.length} className="flex items-center gap-1.5 hover:underline disabled:opacity-40" style={{ fontFamily: PP, fontSize: '12px', fontWeight: 500, color: '#3d5429' }}>
            <Download size={13} /> <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="animate-pulse rounded-xl" style={{ background:'#f0ece0', height:'40px' }} />)}</div>
        ) : !wastedItems.length ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <PackageOpen size={36} style={{ color: '#c8c0b0' }} />
            <p style={{ fontFamily: PP, fontSize: '13px', color: '#9a9080' }}>Belum ada item terbuang. Pertahankan!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[280px]">
              <thead>
                <tr style={{ borderBottom: '1px solid #f0ece0' }}>
                  {['Item', 'Category', 'Est. Loss'].map(h => (
                    <th key={h} className="text-left pb-2" style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#9a9585', letterSpacing: '0.04em', paddingRight: '12px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {wastedItems.map((item: any, i: number) => (
                  <tr key={String(item._id)} style={{ borderBottom: i < wastedItems.length-1 ? '1px solid #f0ece0' : 'none' }}>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: categoryBadge[item.category]?.bg || '#f0ece0' }}>
                          <img src={categoryIcons[item.category] || categoryIcons.Other} alt="" width={16} height={16} />
                        </div>
                        <span style={{ fontFamily: PP, fontSize: '13px', fontWeight: 500 }}>{item.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="px-2 py-0.5 rounded-full" style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, background: categoryBadge[item.category]?.bg || '#f0ece0', color: categoryBadge[item.category]?.color || '#6b6356', whiteSpace: 'nowrap' }}>
                        {(item.category || 'Other').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5" style={{ fontFamily: PP, fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>{item.estLoss ? formatIDR(item.estLoss) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  )
}