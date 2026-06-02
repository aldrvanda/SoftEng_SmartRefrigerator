'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

const PP = "'Poppins', sans-serif"

const navLinks = [
  { href: '/dashboard',      label: 'Dashboard' },
  { href: '/inventory',      label: 'Inventory' },
  { href: '/recipes',        label: 'Recipes' },
  { href: '/reports',        label: 'Reports' },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchUnread = () => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(data => {
        const unread = (data.notifications || []).filter((n: any) => !n.read).length
        setUnreadCount(unread)
      })
      .catch(() => {})
  }

  useEffect(() => {
    // Fetch immediately on mount and on route change
    fetchUnread()

    // Poll every 10s so badge updates after visiting notifications page
    intervalRef.current = setInterval(fetchUnread, 10000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [pathname])

  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between px-8 h-14"
      style={{ background: 'rgba(245,242,232,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e0dbc8' }}
    >
      <Link href="/dashboard"
        style={{ fontFamily: "'Rammetto One', cursive", color: '#1a1a14', fontSize: '1.2rem', textDecoration: 'none' }}>
        Chillo
      </Link>

      <div className="flex items-center gap-6">
        {navLinks.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + '/')
          return (
            <Link key={link.href} href={link.href} className="relative pb-1 transition-colors"
              style={{ fontFamily: PP, fontSize: '14px', fontWeight: active ? 600 : 400, color: active ? '#1a1a14' : '#8a8070', textDecoration: 'none' }}>
              {link.label}
              {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: '#3d5429' }} />}
            </Link>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        {/* Bell */}
        <button
          onClick={() => {
            // Optimistically zero the badge before navigating
            setUnreadCount(0)
            router.push('/notifications')
          }}
          className="relative p-2 rounded-full hover:bg-black/5 transition-colors"
        >
          <img
            src="https://img.icons8.com/ios/24/1a1a14/appointment-reminders--v1.png"
            alt="Notifications"
            width={20}
            height={20}
            style={{ opacity: 0.7 }}
          />
          {unreadCount > 0 && (
            <span
              className="absolute top-1 right-1 flex items-center justify-center text-white rounded-full"
              style={{ width: '16px', height: '16px', fontSize: '9px', fontWeight: 700, background: '#dc2626', fontFamily: PP }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Profile */}
        <button
          onClick={() => router.push('/profile')}
          className="rounded-full hover:opacity-80 transition-opacity overflow-hidden"
          style={{ width: '32px', height: '32px', border: '2px solid #e0dbc8' }}
        >
          <img
            src="https://img.icons8.com/?size=100&id=14736&format=png&color=000000"
            alt="Profile"
            width={32}
            height={32}
          />
        </button>
      </div>
    </nav>
  )
}