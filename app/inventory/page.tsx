'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import StatusBadge from '@/components/ui/StatusBadge'
import StatusBar from '@/components/ui/StatusBar'
import { ItemStatus } from '@/components/ui/StatusBadge'
import { Plus, Search, Pencil, Trash2, X, PackageOpen } from 'lucide-react'

const PP = "'Poppins', sans-serif"

interface InventoryItem {
  _id: string
  name: string
  category: string
  quantity: number
  unit: string
  purchaseDate: string
  expirationDate: string
  daysLeft: number
  status: ItemStatus
  price?: number | null
}

type Filter = 'all' | 'safe' | 'almost' | 'expired'

const CATEGORIES = ['Fruit', 'Vegetable', 'Dairy', 'Meat', 'Seafood', 'Pantry', 'Frozen', 'Beverages', 'Snacks', 'Other'] as const
type Category = typeof CATEGORIES[number]

const categoryColors: Record<string, string> = {
  Fruit: '#fde8d8', Vegetable: '#e6eddc', Dairy: '#e0f0ff', Meat: '#ffe4e4',
  Seafood: '#e0f4f8', Pantry: '#fef3c7', Frozen: '#e8f4fd', Beverages: '#f0e8ff',
  Snacks: '#fff4e0', Other: '#f0ece0',
}
const categoryIcons: Record<string, string> = {
  Fruit:     'https://img.icons8.com/ios/28/e55722/apple.png',
  Vegetable: 'https://img.icons8.com/ios/28/4f6d35/salad.png',
  Dairy:     'https://img.icons8.com/ios/28/1e40af/milk-bottle.png',
  Meat:      'https://img.icons8.com/ios/28/991b1b/steak.png',
  Seafood:   'https://img.icons8.com/ios/28/0369a1/fish.png',
  Pantry:    'https://img.icons8.com/ios/28/92400e/bread.png',
  Frozen:    'https://img.icons8.com/ios/28/1d4ed8/snowflake.png',
  Beverages: 'https://img.icons8.com/ios/28/6d28d9/water-bottle.png',
  Snacks:    'https://img.icons8.com/ios/28/b45309/cookie.png',
  Other:     'https://img.icons8.com/ios/28/6b6356/ingredients.png',
}

function calcDaysLeft(exp: string): number {
  const parts = exp.split('-')
  const local = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  const now = new Date(); now.setHours(0, 0, 0, 0)
  return Math.ceil((local.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}
function getStatus(d: number): ItemStatus {
  return d < 0 ? 'expired' : d <= 3 ? 'almost' : 'safe'
}
function formatIDR(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

// Helper untuk memformat angka langsung menjadi format ribuan IDR saat diketik
function formatThousandSeparator(val: string): string {
  const clean = val.replace(/\D/g, '') // Hapus semua karakter non-angka
  if (!clean) return ''
  return Number(clean).toLocaleString('id-ID')
}

export default function InventoryPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '', category: 'Fruit' as Category,
    quantity: '', unit: 'pcs',
    purchaseDate: '', expirationDate: '',
    price: '', // Tetap string untuk menampung format ribuan (contoh: "25.000")
  })

  const fetchItems = useCallback(() => {
    setLoading(true)
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

  useEffect(() => { fetchItems() }, [fetchItems])

  const filtered = items.filter(item => {
    const matchFilter = filter === 'all' || item.status === filter
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const openAdd = () => {
    setEditItem(null)
    setForm({ name: '', category: 'Fruit', quantity: '', unit: 'pcs', purchaseDate: '', expirationDate: '', price: '' })
    setShowModal(true)
  }
  
  const openEdit = (item: InventoryItem) => {
    setEditItem(item)
    // Nilai price dari database (number) diformat dulu menjadi string ber-separator ribuan
    setForm({ 
      name: item.name, 
      category: item.category as Category, 
      quantity: String(item.quantity), 
      unit: item.unit, 
      purchaseDate: item.purchaseDate, 
      expirationDate: item.expirationDate, 
      price: item.price ? Number(item.price).toLocaleString('id-ID') : '' 
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.expirationDate) return
    setSaving(true)
    try {
      // Hilangkan semua tanda titik (.) sebelum dikonversi ke Number untuk dikirim ke API
      const cleanPrice = form.price.replace(/\./g, '')
      
      const payload = { 
        name: form.name, 
        category: form.category, 
        quantity: form.quantity, 
        unit: form.unit, 
        purchaseDate: form.purchaseDate, 
        expirationDate: form.expirationDate, 
        price: cleanPrice ? Number(cleanPrice) : null 
      }
      const url = editItem ? `/api/inventory/${editItem._id}` : '/api/inventory'
      const res = await fetch(url, { method: editItem ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error('Save failed')
      setShowModal(false)
      fetchItems()
    } catch (e) { console.error(e) } finally { setSaving(false) }
  }

  const handleDelete = async (id: string, reason: string) => {
    setDeleting(true)
    setItems(prev => prev.filter(i => i._id !== id))
    setDeleteTarget(null)
    try {
      await fetch(`/api/inventory/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }) })
      fetchItems()
    } catch { fetchItems() } finally { setDeleting(false) }
  }

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%', fontFamily: PP, fontSize: '13px',
    background: 'var(--color-cream)', borderWidth: '1.5px', borderStyle: 'solid',
    borderColor: focusedField === field ? '#3d5429' : '#e0dbc8',
    borderRadius: '10px', padding: '10px 14px', outline: 'none', transition: 'border-color 0.15s',
  })

  const filterCounts = { all: items.length, safe: items.filter(i => i.status === 'safe').length, almost: items.filter(i => i.status === 'almost').length, expired: items.filter(i => i.status === 'expired').length }

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 animate-slide-up">
        <div>
          <h1 style={{ fontFamily: PP, fontSize: '1.75rem', fontWeight: 700, color: '#1a1a14', marginBottom: '4px' }}>Inventory</h1>
          <p style={{ fontFamily: PP, fontSize: '13px', color: '#8a8070' }}>Kelola dan pantau bahan makanan segar kamu.</p>
        </div>
        <button onClick={openAdd} className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-xl text-white transition-all hover:opacity-90" style={{ background: '#3d5429', fontFamily: PP, fontSize: '13px', fontWeight: 600 }}>
          <Plus size={15} /> Add Item
        </button>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 animate-slide-up stagger-1">
        <div className="relative w-full md:w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9a9585' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari item..."
            className="w-full"
            style={{ fontFamily: PP, fontSize: '13px', paddingLeft: '32px', paddingRight: '16px', paddingTop: '9px', paddingBottom: '9px', borderRadius: '12px', borderWidth: '1.5px', borderStyle: 'solid', borderColor: '#e0dbc8', background: 'white', outline: 'none' }} />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0 snap-x">
          {([{ key: 'all', label: 'All' }, { key: 'safe', label: 'Safe' }, { key: 'almost', label: 'Expiring' }, { key: 'expired', label: 'Expired' }] as { key: Filter; label: string }[]).map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)} className="px-4 py-2 rounded-full flex items-center gap-1.5 transition-all flex-shrink-0 snap-contained"
              style={{ fontFamily: PP, fontSize: '13px', fontWeight: filter === key ? 600 : 400, background: filter === key ? '#3d5429' : 'white', color: filter === key ? 'white' : '#6b6356', borderWidth: '1.5px', borderStyle: 'solid', borderColor: filter === key ? '#3d5429' : '#e0dbc8' }}>
              {label}
              <span style={{ background: filter === key ? 'rgba(255,255,255,0.25)' : '#f0ece0', color: filter === key ? 'white' : '#8a8070', fontWeight: 600, fontSize: '10px', borderRadius: '9999px', padding: '1px 6px' }}>
                {filterCounts[key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table Wrapper */}
      <div className="rounded-2xl overflow-hidden animate-slide-up stagger-2" style={{ background: 'white', border: '1px solid #e0dbc8' }}>
        {loading ? (
          <div>{[1, 2, 3, 4, 5].map(i => (<div key={i} className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: '1px solid #f0ece0' }}><div className="w-8 h-8 rounded-lg animate-pulse" style={{ background: '#f0ece0' }} /><div className="flex-1 h-3 rounded animate-pulse" style={{ background: '#f0ece0' }} /></div>))}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 px-4 text-center">
            <PackageOpen size={40} style={{ color: '#c8c0b0' }} />
            <div>
              <p style={{ fontFamily: PP, fontSize: '14px', fontWeight: 600, color: '#1a1a14', marginBottom: '4px' }}>{search || filter !== 'all' ? 'No items match your filter' : 'Your inventory is empty'}</p>
              <p style={{ fontFamily: PP, fontSize: '13px', color: '#9a9080' }}>{search || filter !== 'all' ? 'Coba hapus pencarian atau ubah filter.' : 'Tambahkan bahan pertama kamu untuk mulai melacak.'}</p>
            </div>
            {!search && filter === 'all' && <button onClick={openAdd} className="px-5 py-2.5 rounded-xl text-white mt-2 transition-all hover:opacity-90 w-full sm:w-auto" style={{ background: '#3d5429', fontFamily: PP, fontSize: '13px', fontWeight: 600 }}>+ Add First Item</button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr style={{ borderBottom: '1px solid #f0ece0', background: '#faf9f5' }}>
                  {['Item', 'Category', 'Qty', 'Price', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3" style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#9a9585', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f0ece0' : 'none' }}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: categoryColors[item.category] || '#f0ece0' }}>
                          <img src={categoryIcons[item.category] || categoryIcons.Other} alt="" width={18} height={18} />
                        </div>
                        <span style={{ fontFamily: PP, fontSize: '13px', fontWeight: 500 }} className="line-clamp-1">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><span className="px-2.5 py-1 rounded-full whitespace-nowrap" style={{ fontFamily: PP, fontSize: '12px', fontWeight: 500, background: categoryColors[item.category] || '#f0ece0', color: '#3d3228' }}>{item.category}</span></td>
                    <td className="px-5 py-3.5 whitespace-nowrap" style={{ fontFamily: PP, fontSize: '13px', color: '#6b6356' }}>{item.quantity} {item.unit}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap" style={{ fontFamily: PP, fontSize: '12px', color: item.price ? '#1a1a14' : '#c0b8a8' }}>{item.price ? formatIDR(item.price) : '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1 min-w-[120px]">
                        <StatusBadge status={item.status} daysLeft={item.daysLeft} />
                        <StatusBar status={item.status} daysLeft={item.daysLeft} />
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><Pencil size={14} style={{ color: '#6b6356' }} /></button>
                        <button onClick={() => setDeleteTarget(item._id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={14} style={{ color: '#dc2626' }} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" style={{ background: 'rgba(0,0,0,0.35)' }}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col" style={{ border: '1px solid #e0dbc8', maxHeight: '90vh' }}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0" style={{ borderBottom: '1px solid #e0dbc8' }}>
              <div>
                <h2 style={{ fontFamily: PP, fontSize: '17px', fontWeight: 700, color: '#1a1a14' }}>{editItem ? 'Edit Item' : 'Add New Item'}</h2>
                <p style={{ fontFamily: PP, fontSize: '12px', color: '#8a8070', marginTop: '2px' }}>Masukkan detail bahan untuk inventaris kamu.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-full hover:bg-gray-100 flex-shrink-0"><X size={18} /></button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              {/* Item Name */}
              <div>
                <label className="block mb-1.5" style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#5a5040', letterSpacing: '0.06em' }}>ITEM NAME</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="cth: Apel Malang, Susu Full Cream..."
                  onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)} style={inputStyle('name')} />
              </div>

              {/* Category */}
              <div>
                <label className="block mb-2" style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#5a5040', letterSpacing: '0.06em' }}>CATEGORY</label>
                <div className="flex gap-2 flex-wrap max-h-[120px] overflow-y-auto pr-1">
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setForm({ ...form, category: cat })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
                      style={{ fontFamily: PP, fontSize: '12px', fontWeight: form.category === cat ? 600 : 400, background: form.category === cat ? '#3d5429' : categoryColors[cat], color: form.category === cat ? 'white' : '#3d3228', borderWidth: '1.5px', borderStyle: 'solid', borderColor: form.category === cat ? '#3d5429' : 'transparent' }}>
                      <img src={categoryIcons[cat]} alt="" width={13} height={13} style={{ filter: form.category === cat ? 'brightness(0) invert(1)' : 'none' }} />
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Qty + Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5" style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#5a5040', letterSpacing: '0.06em' }}>QUANTITY</label>
                  <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="0"
                    onFocus={() => setFocusedField('qty')} onBlur={() => setFocusedField(null)} style={inputStyle('qty')} />
                </div>
                <div>
                  <label className="block mb-1.5" style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#5a5040', letterSpacing: '0.06em' }}>UNIT</label>
                  <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} style={{ ...inputStyle('unit'), cursor: 'pointer' }}>
                    {['pcs', 'kg', 'g', 'lbs', 'oz', 'L', 'ml', 'ct', 'box', 'bag', 'botol', 'kaleng'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Price (Sudah Menggunakan Auto Separator) */}
              <div>
                <label className="block mb-1.5" style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#5a5040', letterSpacing: '0.06em' }}>PURCHASE PRICE (IDR)</label>
                <p style={{ fontFamily: PP, fontSize: '11px', color: '#8a8070', marginBottom: '6px' }}>Digunakan untuk menghitung kerugian di laporan pemborosan.</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ fontFamily: PP, fontSize: '13px', color: '#8a8070' }}>Rp</span>
                  <input 
                    type="text" 
                    inputMode="numeric" 
                    value={form.price} 
                    onChange={e => {
                      const formatted = formatThousandSeparator(e.target.value)
                      setForm({ ...form, price: formatted })
                    }} 
                    placeholder="0"
                    onFocus={() => setFocusedField('price')} 
                    onBlur={() => setFocusedField(null)} 
                    style={{ ...inputStyle('price'), paddingLeft: '36px' }} 
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5" style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#5a5040', letterSpacing: '0.06em' }}>PURCHASE DATE</label>
                  <input type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })}
                    onFocus={() => setFocusedField('pur')} onBlur={() => setFocusedField(null)} style={inputStyle('pur')} />
                </div>
                <div>
                  <label className="block mb-1.5" style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#5a5040', letterSpacing: '0.06em' }}>EXPIRATION DATE</label>
                  <input type="date" value={form.expirationDate} onChange={e => setForm({ ...form, expirationDate: e.target.value })}
                    onFocus={() => setFocusedField('exp')} onBlur={() => setFocusedField(null)} style={inputStyle('exp')} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 flex-shrink-0" style={{ borderTop: '1px solid #e0dbc8' }}>
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl transition-all hover:opacity-80" style={{ background: '#fee2e2', color: '#dc2626', fontFamily: PP, fontSize: '14px', fontWeight: 600 }}>Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.expirationDate} className="flex-1 py-2.5 rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ background: '#3d5429', fontFamily: PP, fontSize: '14px', fontWeight: 600 }}>{saving ? 'Saving...' : 'Save Item'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)' }}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl animate-slide-up" style={{ border: '1px solid #e0dbc8' }}>
            <h3 style={{ fontFamily: PP, fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Remove Item?</h3>
            <p style={{ fontFamily: PP, fontSize: '13px', color: '#8a8070', marginBottom: '16px' }}>Kenapa item ini dihapus? Ini membantu laporan akurat.</p>
            <div className="space-y-2 mb-4">
              {[
                { reason: 'Used for cooking', label: 'Used for Cooking', desc: 'Item sudah dimasak — bagus!' },
                { reason: 'Spoiled / Discarded', label: 'Spoiled / Discarded', desc: 'Akan dicatat di laporan pemborosan.' },
              ].map(({ reason, label, desc }) => (
                <button key={reason} onClick={() => handleDelete(deleteTarget, reason)} disabled={deleting} className="w-full py-3 px-4 rounded-xl text-left hover:bg-gray-50 transition-colors disabled:opacity-60"
                  style={{ fontFamily: PP, fontSize: '13px', borderWidth: '1.5px', borderStyle: 'solid', borderColor: '#e0dbc8' }}>
                  <span style={{ display: 'block', fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: '11px', color: '#9a9585' }}>{desc}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setDeleteTarget(null)} className="w-full py-2.5 rounded-xl hover:bg-gray-50 transition-colors" style={{ fontFamily: PP, fontSize: '13px', color: '#9a9585' }}>Never mind</button>
          </div>
        </div>
      )}
    </AppLayout>
  )
}