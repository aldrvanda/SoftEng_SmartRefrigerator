'use client'

import { useEffect, useState, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { useRouter } from 'next/navigation'

const PP = "'Poppins', sans-serif"

interface Notification {
  _id: string
  type: 'expired' | 'almost' | 'info'
  title: string
  body: string
  icon: string
  read: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifs = useCallback(() => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(data => setNotifs(data.notifications || []))
      .catch(() => setNotifs([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchNotifs() }, [fetchNotifs])

  const markOneRead = async (id: string) => {
    setNotifs(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
    } catch { /* silent */ }
  }

  const markAllRead = async () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
    try { await fetch('/api/notifications/read-all', { method: 'POST' }) } catch { /* silent */ }
  }

  const unread = notifs.filter(n => !n.read)
  const read   = notifs.filter(n => n.read)

  const iconMap: Record<string, string> = {
    warning: 'https://img.icons8.com/ios-filled/20/dc2626/error--v1.png',
    clock:   'https://img.icons8.com/ios/20/d97706/clock--v1.png',
    info:    'https://img.icons8.com/ios/20/3d5429/info--v1.png',
  }

  const NotifCard = ({ n }: { n: Notification }) => (
    <div
      className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-gray-50 cursor-pointer"
      style={{
        borderBottom: '1px solid #f0ece0',
        background: n.read ? 'white'
          : n.type === 'expired' ? '#fff1f0'
          : n.type === 'almost'  ? '#fef9ec'
          : '#f4f7f0',
      }}
      onClick={() => {
        if (!n.read) markOneRead(n._id)
        router.push('/inventory')
      }}
    >
      <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5"
        style={{
          background: n.read ? '#f0ece0'
            : n.type === 'expired' ? '#fee2e2'
            : n.type === 'almost'  ? '#fef3c7'
            : '#e6eddc',
        }}>
        <img src={iconMap[n.icon] || iconMap.info} alt="" width={18} height={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p style={{ fontFamily: PP, fontSize: '13px', fontWeight: n.read ? 400 : 600, color: '#1a1a14' }}>
            {n.title}
          </p>
          {!n.read && <span className="flex-shrink-0 w-2 h-2 rounded-full" style={{ background: '#dc2626' }} />}
        </div>
        <p style={{ fontFamily: PP, fontSize: '12px', color: '#8a8070', marginTop: '2px', lineHeight: 1.5 }}>
          {n.body}
        </p>
        {/* Timestamp intentionally removed */}
      </div>
    </div>
  )

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-0">
        <div className="flex items-start justify-between mb-8 animate-slide-up">
          <div>
            <h1 style={{ fontFamily: PP, fontSize: 'clamp(1.3rem,5vw,1.75rem)', fontWeight: 700, color: '#1a1a14', marginBottom: '4px' }}>
              Notifications
            </h1>
            <p style={{ fontFamily: PP, fontSize: '13px', color: '#8a8070' }}>
              Pantau peringatan kadaluarsa bahan makananmu.
            </p>
          </div>
          {unread.length > 0 && (
            <button onClick={markAllRead}
              className="px-4 py-2 rounded-xl transition-all hover:opacity-80 flex-shrink-0"
              style={{ fontFamily: PP, fontSize: '13px', fontWeight: 500, background: '#f0ece0', color: '#6b6356' }}>
              Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e0dbc8', background: 'white' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: '1px solid #f0ece0' }}>
                <div className="w-9 h-9 rounded-xl animate-pulse" style={{ background: '#f0ece0' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3 rounded animate-pulse" style={{ background: '#f0ece0', width: '60%' }} />
                  <div className="h-3 rounded animate-pulse" style={{ background: '#f0ece0', width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : notifs.length === 0 ? (
          <div className="rounded-2xl flex flex-col items-center justify-center py-20 gap-4"
            style={{ border: '1px solid #e0dbc8', background: 'white' }}>
            <img src="https://img.icons8.com/ios/48/adc491/appointment-reminders--v1.png" alt="" width={48} height={48} />
            <div className="text-center">
              <p style={{ fontFamily: PP, fontSize: '14px', fontWeight: 600, color: '#1a1a14', marginBottom: '4px' }}>All caught up</p>
              <p style={{ fontFamily: PP, fontSize: '13px', color: '#9a9080', maxWidth: '260px' }}>
                Belum ada notifikasi. Tambahkan item ke inventory untuk mendapat peringatan.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {unread.length > 0 && (
              <div>
                <p className="mb-3" style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#9a9585', letterSpacing: '0.08em' }}>
                  NEW · {unread.length}
                </p>
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e0dbc8' }}>
                  {unread.map(n => <NotifCard key={String(n._id)} n={n} />)}
                </div>
              </div>
            )}
            {read.length > 0 && (
              <div>
                <p className="mb-3" style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#9a9585', letterSpacing: '0.08em' }}>
                  EARLIER
                </p>
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e0dbc8' }}>
                  {read.map(n => <NotifCard key={String(n._id)} n={n} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}