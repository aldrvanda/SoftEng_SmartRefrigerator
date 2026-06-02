import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-cream)' }}>
      <Navbar />
      <main className="flex-1 px-8 py-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
      <Footer />
    </div>
  )
}
