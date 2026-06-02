'use client'

import { useState, useEffect } from 'react'
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
  iconUrl?: string
}

type Filter = 'all' | 'safe' | 'almost' | 'expired'

const categoryColors: Record<string, string> = {
  Dairy: '#e0f0ff', Produce: '#e6eddc', Meat: '#ffe4e4', Pantry: '#fef3c7', Frozen: '#e8f4fd',
}

// Icons8 icon map per category
const categoryIcons: Record<string, string> = {
  Produce:  'https://img.icons8.com/ios/28/4f6d35/salad.png',
  Dairy:    'https://img.icons8.com/ios/28/1e40af/milk-bottle.png',
  Meat:     'https://img.icons8.com/ios/28/991b1b/steak.png',
  Pantry:   'https://img.icons8.com/ios/28/92400e/bread.png',
  Frozen:   'https://img.icons8.com/ios/28/1d4ed8/snowflake.png',
  Other:    'https://img.icons8.com/ios/28/6b6356/ingredients.png',
}

function calcDaysLeft(exp: string) {
  const d = new Date(exp); const now = new Date(); now.setHours(0,0,0,0)
  return Math.ceil((d.getTime() - now.getTime()) / (1000*60*60*24))
}
function getStatus(d: number): ItemStatus { return d < 0 ? 'expired' : d <= 3 ? 'almost' : 'safe' }

export default function InventoryPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '', category: 'Produce', quantity: '', unit: 'pcs', purchaseDate: '', expirationDate: '',
  })

  const fetchItems = () => {
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
  }

  useEffect(() => { fetchItems() }, [])

  const filtered = items.filter(item => {
    const matchFilter = filter === 'all' || item.status === filter
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const openAdd = () => {
    setEditItem(null)
    setForm({ name: '', category: 'Produce', quantity: '', unit: 'pcs', purchaseDate: '', expirationDate: '' })
    setShowModal(true)
  }

  const openEdit = (item: InventoryItem) => {
    setEditItem(item)
    setForm({ name: item.name, category: item.category, quantity: String(item.quantity), unit: item.unit, purchaseDate: item.purchaseDate, expirationDate: item.expirationDate })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.expirationDate) return
    setSaving(true)
    try {
      if (editItem) {
        await fetch(`/api/inventory/${editItem._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      } else {
        await fetch('/api/inventory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      }
      setShowModal(false)
      fetchItems()
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/inventory/${id}`, { method: 'DELETE' })
    setDeleteTarget(null)
    fetchItems()
  }

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%', fontFamily: PP, fontSize: '13px',
    background: 'var(--color-cream)', borderWidth: '1.5px', borderStyle: 'solid',
    borderColor: focusedField === field ? '#4f6d35' : '#e0dbc8',
    borderRadius: '12px', outline: 'none', color: '#1a1a14',
    boxShadow: focusedField === field ? '0 0 0 3px rgba(79,109,53,0.12)' : 'none',
    padding: '11px 14px', transition: 'border-color 0.15s, box-shadow 0.15s',
  })

  const filterTabs: { key: Filter; label: string; color: string }[] = [
    { key: 'all',     label: 'All Items',       color: '#3d5429' },
    { key: 'safe',    label: 'Safe',             color: '#16a34a' },
    { key: 'almost',  label: 'Almost Expiring',  color: '#d97706' },
    { key: 'expired', label: 'Expired',          color: '#dc2626' },
  ]

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 animate-slide-up">
        <div>
          <h1 style={{ fontFamily: PP, fontSize: '1.75rem', fontWeight: 700, color: '#1a1a14', marginBottom: '4px' }}>Kitchen Inventory</h1>
          <p style={{ fontFamily: PP, fontSize: '13px', color: '#8a8070' }}>Manage your ingredients and monitor expiration dates.</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white transition-all hover:opacity-90"
          style={{ background: '#3d5429', fontFamily: PP, fontSize: '13px', fontWeight: 600 }}>
          <Plus size={16} /> Add Item
        </button>
      </div>

      {/* Filters + Search */}
      <div className="flex items-center justify-between p-3 rounded-2xl mb-6 animate-slide-up stagger-1"
        style={{ background: 'white', border: '1px solid #e0dbc8' }}>
        <div className="flex gap-2 flex-wrap">
          {filterTabs.map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className="px-4 py-1.5 rounded-full transition-all"
              style={{ fontFamily: PP, fontSize: '12px', fontWeight: filter === tab.key ? 600 : 400, background: filter === tab.key ? tab.color : 'transparent', color: filter === tab.key ? 'white' : '#6b6356', borderWidth: '1px', borderStyle: 'solid', borderColor: filter === tab.key ? tab.color : '#e0dbc8' }}>
              {tab.label}
              {tab.key !== 'all' && (
                <span style={{ marginLeft: '5px', opacity: 0.75, fontSize: '11px' }}>
                  ({items.filter(i => i.status === tab.key).length})
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9a9585' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search inventory..."
            style={{ fontFamily: PP, fontSize: '13px', paddingLeft: '30px', paddingRight: '14px', paddingTop: '8px', paddingBottom: '8px', borderRadius: '12px', borderWidth: '1.5px', borderStyle: 'solid', borderColor: '#e0dbc8', background: 'var(--color-cream)', outline: 'none', width: '200px' }} />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden animate-slide-up stagger-2"
        style={{ border: '1px solid #e0dbc8', background: 'white' }}>
        {loading ? (
          <div className="space-y-0">
            {[1,2,3].map(i => <div key={i} className="animate-pulse mx-5 my-4 rounded-xl" style={{ background: '#f0ece0', height: '48px' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <PackageOpen size={40} style={{ color: '#c8c0b0' }} />
            <p style={{ fontFamily: PP, fontSize: '13px', color: '#9a9080' }}>
              {items.length === 0 ? 'No items yet. Click "+ Add Item" to get started.' : 'No items match your filter.'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #e0dbc8', background: 'var(--color-cream)' }}>
                {['ITEM NAME', 'CATEGORY', 'QUANTITY', 'STATUS', 'ACTIONS'].map(h => (
                  <th key={h} className="text-left px-5 py-3"
                    style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#9a9585', letterSpacing: '0.06em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <tr key={item._id} className="hover:bg-gray-50 transition-colors"
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f0ece0' : 'none' }}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: categoryColors[item.category] || '#f0ece0' }}>
                        <img src={categoryIcons[item.category] || categoryIcons.Other} alt="" width={18} height={18} />
                      </div>
                      <span style={{ fontFamily: PP, fontSize: '13px', fontWeight: 500 }}>{item.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-1 rounded-full"
                      style={{ fontFamily: PP, fontSize: '12px', fontWeight: 500, background: categoryColors[item.category] || '#f0ece0', color: '#3d3228' }}>
                      {item.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5" style={{ fontFamily: PP, fontSize: '13px', color: '#6b6356' }}>
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-col gap-1">
                      <StatusBadge status={item.status} daysLeft={item.daysLeft} />
                      <StatusBar status={item.status} daysLeft={item.daysLeft} />
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <Pencil size={14} style={{ color: '#6b6356' }} />
                      </button>
                      <button onClick={() => setDeleteTarget(item._id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 size={14} style={{ color: '#dc2626' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Add/Edit Modal ── fixed overlay + scrollable content */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.35)' }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col"
            style={{ border: '1px solid #e0dbc8', maxHeight: '90vh' }}
          >
            {/* Modal header — fixed */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0"
              style={{ borderBottom: '1px solid #e0dbc8' }}>
              <div>
                <h2 style={{ fontFamily: PP, fontSize: '17px', fontWeight: 700, color: '#1a1a14' }}>
                  {editItem ? 'Edit Item' : 'Add New Item'}
                </h2>
                <p style={{ fontFamily: PP, fontSize: '12px', color: '#8a8070', marginTop: '2px' }}>
                  Enter the details of the ingredient for your inventory.
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-full hover:bg-gray-100 flex-shrink-0">
                <X size={18} />
              </button>
            </div>

            {/* Modal body — scrollable */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

              {/* Name */}
              <div>
                <label className="block mb-1.5" style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#5a5040', letterSpacing: '0.06em' }}>ITEM NAME</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="e.g., Organic Carrots"
                  onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)}
                  style={inputStyle('name')} />
              </div>

              {/* Category */}
              <div>
                <label className="block mb-1.5" style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#5a5040', letterSpacing: '0.06em' }}>CATEGORY</label>
                <div className="flex gap-2 flex-wrap">
                  {(['Produce', 'Dairy', 'Meat', 'Pantry', 'Frozen'] as const).map(cat => (
                    <button key={cat} onClick={() => setForm({...form, category: cat})}
                      className="px-3.5 py-2 rounded-full transition-all flex items-center gap-1.5"
                      style={{ fontFamily: PP, fontSize: '12px', fontWeight: form.category === cat ? 600 : 400, background: form.category === cat ? '#3d5429' : 'var(--color-cream)', color: form.category === cat ? 'white' : '#6b6356', borderWidth: '1.5px', borderStyle: 'solid', borderColor: form.category === cat ? '#3d5429' : '#e0dbc8' }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity + Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5" style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#5a5040', letterSpacing: '0.06em' }}>QUANTITY</label>
                  <input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})}
                    placeholder="0"
                    onFocus={() => setFocusedField('qty')} onBlur={() => setFocusedField(null)}
                    style={inputStyle('qty')} />
                </div>
                <div>
                  <label className="block mb-1.5" style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#5a5040', letterSpacing: '0.06em' }}>UNIT</label>
                  <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}
                    style={{ ...inputStyle('unit'), appearance: 'auto' }}>
                    {['pcs','kg','g','lbs','oz','L','ml','ct','box','bag'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5" style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#5a5040', letterSpacing: '0.06em' }}>PURCHASE DATE</label>
                  <input type="date" value={form.purchaseDate} onChange={e => setForm({...form, purchaseDate: e.target.value})}
                    onFocus={() => setFocusedField('purchase')} onBlur={() => setFocusedField(null)}
                    style={inputStyle('purchase')} />
                </div>
                <div>
                  <label className="block mb-1.5" style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#5a5040', letterSpacing: '0.06em' }}>EXPIRATION DATE</label>
                  <input type="date" value={form.expirationDate} onChange={e => setForm({...form, expirationDate: e.target.value})}
                    onFocus={() => setFocusedField('exp')} onBlur={() => setFocusedField(null)}
                    style={inputStyle('exp')} />
                </div>
              </div>
            </div>

            {/* Modal footer — fixed */}
            <div className="flex gap-3 px-6 py-4 flex-shrink-0" style={{ borderTop: '1px solid #e0dbc8' }}>
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl transition-all hover:opacity-80"
                style={{ background: '#fee2e2', color: '#dc2626', fontFamily: PP, fontSize: '14px', fontWeight: 600 }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.expirationDate}
                className="flex-1 py-2.5 rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: '#3d5429', fontFamily: PP, fontSize: '14px', fontWeight: 600 }}>
                {saving ? 'Saving…' : 'Save Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.35)' }}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl animate-slide-up"
            style={{ border: '1px solid #e0dbc8' }}>
            <h3 style={{ fontFamily: PP, fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Remove Item?</h3>
            <p style={{ fontFamily: PP, fontSize: '13px', color: '#8a8070', marginBottom: '16px' }}>Why are you removing this item?</p>
            <div className="space-y-2 mb-4">
              {['Used for cooking', 'Spoiled / Discarded'].map(reason => (
                <button key={reason} onClick={() => handleDelete(deleteTarget)}
                  className="w-full py-2.5 px-4 rounded-xl text-left hover:bg-gray-50 transition-colors"
                  style={{ fontFamily: PP, fontSize: '13px', fontWeight: 500, borderWidth: '1.5px', borderStyle: 'solid', borderColor: '#e0dbc8' }}>
                  {reason}
                </button>
              ))}
            </div>
            <button onClick={() => setDeleteTarget(null)} className="w-full py-2.5 rounded-xl"
              style={{ fontFamily: PP, fontSize: '13px', color: '#9a9585' }}>
              Never mind
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
