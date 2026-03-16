import type { Metadata } from 'next'
import Sidebar from '@/components/shared/Sidebar'
import Topbar from '@/components/shared/Topbar'
import './globals.css'

export const metadata: Metadata = {
  title: 'WP Maintenance Manager',
  description: 'Gérez la maintenance de vos sites WordPress clients',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--color-background-secondary)' }}>

          {/* ── Sidebar ── */}
          <Sidebar />

          {/* ── Zone principale ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            <Topbar />
            <main style={{ flex: 1, overflowY: 'auto', background: 'var(--color-background-secondary)' }}>
              {children}
            </main>
          </div>

        </div>
      </body>
    </html>
  )
}
