import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-cream)' }}>
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto" style={{ padding: 'clamp(16px, 4vw, 32px)' }}>
        {children}
      </main>
      <Footer />
    </div>
  )
}
