'use client'

import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { useRouter } from 'next/navigation'
import { ArrowRight, PackageOpen, MoreHorizontal } from 'lucide-react'

const PP = "'Poppins', sans-serif"

interface InventoryItem {
  _id: string
  name: string
  category: string
  quantity: number
  unit: string
  expirationDate: string
  daysLeft: number
  status: 'safe' | 'almost' | 'expired'
}

const categoryIcons: Record<string, string> = {
  Fruit:'https://img.icons8.com/ios/28/e55722/apple.png',
  Vegetable:'https://img.icons8.com/ios/28/4f6d35/salad.png',
  Dairy:'https://img.icons8.com/ios/28/1e40af/milk-bottle.png',
  Meat:'https://img.icons8.com/ios/28/991b1b/steak.png',
  Seafood:'https://img.icons8.com/ios/28/0369a1/fish.png',
  Pantry:'https://img.icons8.com/ios/28/92400e/bread.png',
  Frozen:'https://img.icons8.com/ios/28/1d4ed8/snowflake.png',
  Beverages:'https://img.icons8.com/ios/28/6d28d9/water-bottle.png',
  Snacks:'https://img.icons8.com/ios/28/b45309/cookie.png',
  Produce:'https://img.icons8.com/ios/28/4f6d35/salad.png',
  Other:'https://img.icons8.com/ios/28/6b6356/ingredients.png',
}
const categoryBg: Record<string, string> = {
  Fruit:'#fde8d8', Vegetable:'#e6eddc', Dairy:'#e0f0ff', Meat:'#ffe4e4',
  Seafood:'#e0f4f8', Pantry:'#fef3c7', Frozen:'#e8f4fd', Beverages:'#f0e8ff',
  Snacks:'#fff4e0', Produce:'#e6eddc', Other:'#f0ece0',
}

function calcDaysLeft(exp: string): number {
  const parts = exp.split('-')
  const local = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  const now = new Date(); now.setHours(0, 0, 0, 0)
  return Math.ceil((local.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}
function getStatus(d: number): 'safe' | 'almost' | 'expired' {
  return d < 0 ? 'expired' : d <= 3 ? 'almost' : 'safe'
}
function priorityLabel(daysLeft: number, status: string) {
  if (status === 'expired') return `Expired ${Math.abs(daysLeft)}d ago`
  if (daysLeft === 0) return 'Expires today'
  if (daysLeft === 1) return 'Expires tomorrow'
  return `Expires in ${daysLeft}d`
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3 px-4">
      <PackageOpen size={32} style={{ color: '#c8c0b0' }} />
      <p style={{ fontFamily: PP, fontSize: '13px', color: '#9a9080', textAlign: 'center' }}>{message}</p>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/inventory')
      .then(r => r.json())
      .then(data => {
        const parsed = (data.items || []).map((item: any) => {
          const dl = calcDaysLeft(item.expirationDate)
          return { ...item, _id: String(item._id), daysLeft: dl, status: getStatus(dl) }
        })
        setItems(parsed)
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const totalItems = items.length
  const expiringSoon = items.filter(i => i.status === 'almost').length
  const expired = items.filter(i => i.status === 'expired').length
  const priorityItems = items
    .filter(i => i.status === 'expired' || (i.status === 'almost' && i.daysLeft <= 2))
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 4)

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-8 animate-slide-up">
        <h1 style={{ fontFamily: PP, fontSize: 'clamp(1.3rem,5vw,1.75rem)', fontWeight: 700, color: '#1a1a14', marginBottom: '4px' }}>
          Stock Overview
        </h1>
        <p style={{ fontFamily: PP, fontSize: '13px', color: '#8a8070' }}>Berikut yang butuh perhatianmu hari ini.</p>
      </div>

      {/* Stats — 1 col mobile, 3 col sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'TOTAL ITEMS',   value: totalItems,   icon: 'https://img.icons8.com/ios/32/3d5429/fridge.png',    bg: '#ffffff', accent: '#3d5429' },
          { label: 'EXPIRING SOON', value: expiringSoon, icon: 'https://img.icons8.com/ios/32/d97706/clock--v1.png', bg: '#fef9ec', accent: '#d97706' },
          { label: 'EXPIRED',       value: expired,      icon: 'https://img.icons8.com/ios/32/dc2626/error--v1.png', bg: '#fff1f0', accent: '#dc2626' },
        ].map((stat, i) => (
          <div key={stat.label} className={`rounded-2xl p-5 flex items-center justify-between animate-slide-up stagger-${i + 1}`} style={{ background: stat.bg, border: '1px solid #e0dbc8' }}>
            <div>
              <p style={{ fontFamily: PP, fontSize: '10px', fontWeight: 600, color: '#9a9585', letterSpacing: '0.08em', marginBottom: '8px' }}>{stat.label}</p>
              <p style={{ fontFamily: PP, fontSize: 'clamp(1.75rem,6vw,2.25rem)', fontWeight: 700, color: stat.accent, lineHeight: 1 }}>{loading ? '—' : stat.value}</p>
            </div>
            <img src={stat.icon} alt="" width={32} height={32} style={{ opacity: 0.85 }} />
          </div>
        ))}
      </div>

      {/* Priority + Smart Insight — stack on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 style={{ fontFamily: PP, fontSize: '15px', fontWeight: 600 }}>Priority Attention</h2>
              <p style={{ fontFamily: PP, fontSize: '12px', color: '#8a8070', marginTop: '2px' }}>Item kadaluarsa atau habis dalam 2 hari.</p>
            </div>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{[1,2,3,4].map(i=><div key={i} className="rounded-xl animate-pulse" style={{ background:'#f0ece0', height:'72px' }} />)}</div>
          ) : priorityItems.length === 0 ? (
            <div className="rounded-2xl" style={{ background: 'white', border: '1px solid #e0dbc8' }}>
              <EmptyState message="Semua bahan masih aman. Dapur kamu dalam kondisi bagus!" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {priorityItems.map((item, i) => (
                <div key={item._id} className={`bg-white rounded-xl p-4 flex items-center justify-between animate-slide-up stagger-${i + 1}`} style={{ border: '1px solid #e0dbc8' }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: categoryBg[item.category] || '#f0ece0' }}>
                      <img src={categoryIcons[item.category] || categoryIcons.Other} alt="" width={20} height={20} />
                    </div>
                    <div className="min-w-0">
                      <p style={{ fontFamily: PP, fontSize: '13px', fontWeight: 500 }} className="truncate">{item.name}</p>
                      <p style={{ fontFamily: PP, fontSize: '11px', color: item.status === 'expired' ? '#dc2626' : '#d97706' }}>
                        {priorityLabel(item.daysLeft, item.status)}
                      </p>
                    </div>
                  </div>
                  <button className="p-1 rounded-full hover:bg-gray-100 flex-shrink-0" onClick={() => router.push('/inventory')}>
                    <MoreHorizontal size={15} style={{ color: '#9a9585' }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Smart Insight */}
        <div className="rounded-2xl p-5 flex flex-col justify-between animate-slide-up stagger-4" style={{ background: '#3d5429', color: 'white' }}>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="https://img.icons8.com/ios-filled/16/ffffff/idea.png" alt="" width={16} height={16} />
              <p style={{ fontFamily: PP, fontSize: '13px', fontWeight: 600 }}>Smart Insight</p>
            </div>
            <p style={{ fontFamily: PP, fontSize: '12px', lineHeight: 1.6, opacity: 0.9 }}>
              {priorityItems.length > 0
                ? `${priorityItems.length} item perlu segera digunakan. Cek resep untuk menghabiskannya sebelum basi.`
                : totalItems === 0
                ? 'Inventaris kosong. Tambahkan bahan untuk mulai melacak kadaluarsa.'
                : 'Inventaris terlihat segar! Semua masih aman saat ini.'}
            </p>
          </div>
          <button onClick={() => router.push(totalItems === 0 ? '/inventory' : '/recipes')}
            className="mt-4 w-full py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ background: 'white', color: '#3d5429', fontFamily: PP, fontSize: '13px', fontWeight: 600 }}>
            <img src="https://img.icons8.com/ios/14/3d5429/cooking-book.png" alt="" width={14} height={14} />
            {totalItems === 0 ? 'Add First Item' : 'Browse Recipes'}
          </button>
        </div>
      </div>

      {/* Recent Inventory */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontFamily: PP, fontSize: '15px', fontWeight: 600 }}>Recent Inventory</h2>
          <button onClick={() => router.push('/inventory')} className="flex items-center gap-1 hover:underline" style={{ fontFamily: PP, fontSize: '13px', fontWeight: 500, color: '#4f6d35' }}>
            View all <ArrowRight size={13} />
          </button>
        </div>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="rounded-xl animate-pulse" style={{ background:'#f0ece0', height:'56px' }} />)}</div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl" style={{ background: 'white', border: '1px solid #e0dbc8' }}>
            <EmptyState message="Belum ada item. Tambahkan bahan pertamamu!" />
            <div className="pb-6 flex justify-center">
              <button onClick={() => router.push('/inventory')} className="px-5 py-2.5 rounded-xl text-white hover:opacity-90" style={{ background: '#3d5429', fontFamily: PP, fontSize: '13px', fontWeight: 600 }}>+ Add First Item</button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #e0dbc8' }}>
            {items.slice(0, 5).map((item, i) => (
              <div key={item._id} className="flex items-center justify-between px-4 sm:px-5 py-3.5 hover:bg-gray-50 transition-colors"
                style={{ borderBottom: i < Math.min(items.length, 5) - 1 ? '1px solid #f0ece0' : 'none' }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: categoryBg[item.category] || '#f0ece0' }}>
                    <img src={categoryIcons[item.category] || categoryIcons.Other} alt="" width={18} height={18} />
                  </div>
                  <div className="min-w-0">
                    <p style={{ fontFamily: PP, fontSize: '13px', fontWeight: 500 }} className="truncate">{item.name}</p>
                    <p style={{ fontFamily: PP, fontSize: '11px', color: '#9a9080' }}>{item.quantity} {item.unit} · {item.category}</p>
                  </div>
                </div>
                <span className={item.status === 'expired' ? 'badge-expired' : item.status === 'almost' ? 'badge-almost' : 'badge-safe'} style={{ flexShrink: 0 }}>
                  {item.status === 'expired' ? 'Expired' : item.daysLeft === 0 ? 'Today' : `${item.daysLeft}d`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
