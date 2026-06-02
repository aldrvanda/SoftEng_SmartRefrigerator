'use client'

import { useEffect, useState, useTransition } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { useRouter } from 'next/navigation'
import { logoutAction } from '@/lib/actions'
import { Loader2, CheckCircle2 } from 'lucide-react'

const PP = "'Poppins', sans-serif"

interface UserProfile {
  name: string
  email: string
  createdAt: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [stats, setStats] = useState({ total: 0, expiring: 0, expired: 0 })

  useEffect(() => {
    Promise.all([
      fetch('/api/profile').then(r => r.json()),
      fetch('/api/inventory').then(r => r.json()),
    ]).then(([profileData, inventoryData]) => {
      if (profileData.user) {
        setUser(profileData.user)
        setName(profileData.user.name)
      }
      const items = inventoryData.items || []
      const now = new Date(); now.setHours(0,0,0,0)
      const calcDays = (exp: string) => Math.ceil((new Date(exp).getTime() - now.getTime()) / 86400000)
      setStats({
        total: items.length,
        expiring: items.filter((i: any) => { const d = calcDays(i.expirationDate); return d >= 0 && d <= 3 }).length,
        expired: items.filter((i: any) => calcDays(i.expirationDate) < 0).length,
      })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!name || name.trim().length < 2) return
    setSaving(true)
    try {
      await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
      setSavedMsg('Profile updated!')
      setTimeout(() => setSavedMsg(''), 3000)
    } catch {}
    finally { setSaving(false) }
  }

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction()
      router.push('/login')
    })
  }

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%', fontFamily: PP, fontSize: '13px',
    background: '#faf8f3',
    borderWidth: '1.5px', borderStyle: 'solid',
    borderColor: focusedField === field ? '#4f6d35' : '#ddd8c8',
    borderRadius: '12px', outline: 'none', color: '#1a1a14',
    boxShadow: focusedField === field ? '0 0 0 3px rgba(79,109,53,0.12)' : 'none',
    padding: '12px 16px', transition: 'border-color 0.15s, box-shadow 0.15s',
  })

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—'

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <h1 style={{ fontFamily: PP, fontSize: '1.75rem', fontWeight: 700, color: '#1a1a14', marginBottom: '4px' }}>
            My Profile
          </h1>
          <p style={{ fontFamily: PP, fontSize: '13px', color: '#8a8070' }}>
            Manage your account and preferences.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl p-8 flex items-center justify-center" style={{ background: 'white', border: '1px solid #e0dbc8' }}>
            <Loader2 size={24} className="animate-spin" style={{ color: '#adc491' }} />
          </div>
        ) : (
          <div className="space-y-5">

            {/* Avatar + info */}
            <div className="rounded-2xl p-6 animate-slide-up stagger-1"
              style={{ background: 'white', border: '1px solid #e0dbc8' }}>
              <div className="flex items-center gap-5">
                <div className="rounded-2xl overflow-hidden flex-shrink-0"
                  style={{ width: '64px', height: '64px', background: '#f4f7f0', border: '2px solid #e0dbc8' }}>
                  <img
                    src="https://img.icons8.com/?size=100&id=14736&format=png&color=000000"
                    alt="Profile"
                    width={64}
                    height={64}
                  />
                </div>
                <div>
                  <p style={{ fontFamily: PP, fontSize: '16px', fontWeight: 700, color: '#1a1a14' }}>
                    {user?.name || '—'}
                  </p>
                  <p style={{ fontFamily: PP, fontSize: '13px', color: '#8a8070', marginTop: '2px' }}>
                    {user?.email || '—'}
                  </p>
                  <p style={{ fontFamily: PP, fontSize: '11px', color: '#adc491', marginTop: '4px', fontWeight: 500 }}>
                    Member since {memberSince}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 animate-slide-up stagger-2">
              {[
                { label: 'Total Items', value: stats.total, color: '#3d5429' },
                { label: 'Expiring Soon', value: stats.expiring, color: '#d97706' },
                { label: 'Expired', value: stats.expired, color: '#dc2626' },
              ].map(stat => (
                <div key={stat.label} className="rounded-2xl p-4 text-center"
                  style={{ background: 'white', border: '1px solid #e0dbc8' }}>
                  <p style={{ fontFamily: PP, fontSize: '1.5rem', fontWeight: 700, color: stat.color }}>{stat.value}</p>
                  <p style={{ fontFamily: PP, fontSize: '11px', color: '#9a9080', marginTop: '2px' }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Edit name */}
            <div className="rounded-2xl p-6 animate-slide-up stagger-3"
              style={{ background: 'white', border: '1px solid #e0dbc8' }}>
              <h3 style={{ fontFamily: PP, fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: '#1a1a14' }}>
                Edit Profile
              </h3>

              {savedMsg && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4"
                  style={{ background: '#e6eddc', color: '#2d4a1a', fontFamily: PP, fontSize: '13px', fontWeight: 500 }}>
                  <CheckCircle2 size={15} /> {savedMsg}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block mb-2"
                    style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#5a5040', letterSpacing: '0.06em' }}>
                    FULL NAME
                  </label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    style={inputStyle('name')}
                  />
                </div>
                <div>
                  <label className="block mb-2"
                    style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#5a5040', letterSpacing: '0.06em' }}>
                    EMAIL ADDRESS
                  </label>
                  <input
                    value={user?.email || ''}
                    disabled
                    style={{ ...inputStyle('email'), opacity: 0.6, cursor: 'not-allowed' }}
                  />
                  <p style={{ fontFamily: PP, fontSize: '11px', color: '#9a9080', marginTop: '4px' }}>
                    Email cannot be changed.
                  </p>
                </div>
              </div>

              <button onClick={handleSave} disabled={saving}
                className="w-full py-3 rounded-xl text-white mt-5 flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: '#3d5429', fontFamily: PP, fontSize: '14px', fontWeight: 600 }}>
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Save Changes'}
              </button>
            </div>

            {/* Logout */}
            <div className="rounded-2xl p-6 animate-slide-up stagger-4"
              style={{ background: 'white', border: '1px solid #e0dbc8' }}>
              <h3 style={{ fontFamily: PP, fontSize: '14px', fontWeight: 600, marginBottom: '4px', color: '#1a1a14' }}>
                Sign Out
              </h3>
              <p style={{ fontFamily: PP, fontSize: '12px', color: '#8a8070', marginBottom: '16px' }}>
                You will be redirected to the login page.
              </p>
              <button onClick={handleLogout} disabled={isPending}
                className="w-full py-3 rounded-xl transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: '#fff1f0', color: '#dc2626', fontFamily: PP, fontSize: '14px', fontWeight: 600, borderWidth: '1px', borderStyle: 'solid', borderColor: '#fecaca' }}>
                {isPending ? <><Loader2 size={14} className="animate-spin" /> Signing out…</> : 'Sign Out'}
              </button>
            </div>

          </div>
        )}
      </div>
    </AppLayout>
  )
}
