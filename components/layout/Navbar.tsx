'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Menu, X } from 'lucide-react'

const PP = "'Poppins', sans-serif"

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/inventory', label: 'Inventory' },
  { href: '/recipes',   label: 'Recipes' },
  { href: '/reports',   label: 'Reports' },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchUnread = useCallback(() => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(data => {
        const unread = (data.notifications || []).filter((n: any) => !n.read).length
        setUnreadCount(unread)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchUnread()
    setMobileOpen(false) // close on route change
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(fetchUnread, 5000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [pathname, fetchUnread])

  return (
    <>
      {/* Fixed navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: '56px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 'clamp(12px,4vw,32px)', paddingRight: 'clamp(12px,4vw,32px)',
        background: 'rgba(245,242,232,0.97)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid #e0dbc8',
      }}>
        {/* Logo */}
        <Link href="/dashboard" style={{ fontFamily: "'Rammetto One', cursive", color: '#1a1a14', fontSize: '1.2rem', textDecoration: 'none', flexShrink: 0 }}>
          Chillo
        </Link>

        {/* Desktop nav links */}
        <div className="hidden sm:flex" style={{ alignItems: 'center', gap: '1.5rem' }}>
          {navLinks.map(link => {
            const active = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link key={link.href} href={link.href}
                style={{ fontFamily: PP, fontSize: '14px', fontWeight: active ? 600 : 400, color: active ? '#1a1a14' : '#8a8070', textDecoration: 'none', position: 'relative', paddingBottom: '4px' }}>
                {link.label}
                {active && <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', borderRadius: '9999px', background: '#3d5429' }} />}
              </Link>
            )
          })}
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Bell */}
          <button onClick={() => router.push('/notifications')} aria-label="Notifications"
            style={{ position: 'relative', padding: '8px', borderRadius: '9999px', background: 'transparent', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <img src="https://img.icons8.com/ios/24/1a1a14/appointment-reminders--v1.png" alt="Notifications" width={20} height={20} style={{ opacity: 0.7, display: 'block' }} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: '4px', right: '4px', width: '16px', height: '16px', background: '#dc2626', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: 'white', fontFamily: PP }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Profile — hidden on mobile */}
          <button onClick={() => router.push('/profile')} aria-label="Profile" className="hidden sm:block"
            style={{ width: '32px', height: '32px', borderRadius: '9999px', border: '2px solid #e0dbc8', overflow: 'hidden', cursor: 'pointer', background: 'none', padding: 0 }}>
            <img src="https://img.icons8.com/?size=100&id=14736&format=png&color=000000" alt="Profile" width={32} height={32} style={{ display: 'block' }} />
          </button>

          {/* Hamburger — mobile only */}
          <button className="sm:hidden" onClick={() => setMobileOpen(o => !o)} aria-label="Menu"
            style={{ padding: '8px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#1a1a14' }}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Spacer */}
      <div style={{ height: '56px', flexShrink: 0 }} />

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="sm:hidden"
          style={{ position: 'fixed', top: '56px', left: 0, right: 0, zIndex: 40, background: 'rgba(245,242,232,0.98)', borderBottom: '1px solid #e0dbc8', paddingBottom: '12px' }}>
          {navLinks.map(link => {
            const active = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                style={{ display: 'block', fontFamily: PP, fontSize: '15px', fontWeight: active ? 600 : 400, color: active ? '#3d5429' : '#1a1a14', textDecoration: 'none', padding: '12px clamp(12px,4vw,32px)', borderLeft: active ? '3px solid #3d5429' : '3px solid transparent', background: active ? 'rgba(61,84,41,0.05)' : 'transparent' }}>
                {link.label}
              </Link>
            )
          })}
          <div style={{ padding: '8px clamp(12px,4vw,32px) 0' }}>
            <button onClick={() => { setMobileOpen(false); router.push('/profile') }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: PP, fontSize: '15px', color: '#1a1a14', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0' }}>
              <img src="https://img.icons8.com/?size=100&id=14736&format=png&color=000000" alt="" width={24} height={24} style={{ borderRadius: '50%', border: '1.5px solid #e0dbc8' }} />
              Profile
            </button>
          </div>
        </div>
      )}
    </>
  )
}
