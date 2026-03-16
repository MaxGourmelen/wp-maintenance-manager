'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

// ─── Mapping chemin → titre de page ────────────────────────────────────────
const PAGE_TITLES: Record<string, string> = {
  '/dashboard':  'Dashboard',
  '/clients':    'Clients',
  '/import':     'Import Google Sheets',
  '/export':     'Export CSV',
  '/settings':   'Paramètres',
}

function getPageMeta(pathname: string): { title: string; crumbs: { label: string; href: string }[] } {
  // Fiche client : /clients/[id]
  if (/^\/clients\/[^/]+$/.test(pathname) && !pathname.endsWith('/new')) {
    return { title: 'Fiche client', crumbs: [{ label: 'Clients', href: '/clients' }, { label: 'Fiche', href: pathname }] }
  }
  if (/^\/clients\/[^/]+\/edit$/.test(pathname)) {
    const id = pathname.split('/')[2]
    return { title: 'Modifier le client', crumbs: [{ label: 'Clients', href: '/clients' }, { label: 'Modifier', href: pathname }] }
  }
  if (pathname === '/clients/new') {
    return { title: 'Nouveau client', crumbs: [{ label: 'Clients', href: '/clients' }, { label: 'Nouveau', href: '/clients/new' }] }
  }

  const title = PAGE_TITLES[pathname] ?? 'WP Maintenance'
  return { title, crumbs: [] }
}

// ─── Composant Topbar ──────────────────────────────────────────────────────
export default function Topbar() {
  const pathname = usePathname()
  const { title, crumbs } = getPageMeta(pathname)

  return (
    <header style={{ height: 50, background: 'var(--color-background-primary)', borderBottom: '0.5px solid var(--color-border-tertiary)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, flexShrink: 0 }}>

      {/* ── Titre / Breadcrumb ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        {crumbs.length > 0
          ? crumbs.map((crumb, i) => (
              <span key={crumb.href} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {i > 0 && <span style={{ color: 'var(--color-text-tertiary)', fontSize: 12 }}>›</span>}
                {i < crumbs.length - 1
                  ? <Link href={crumb.href} style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{crumb.label}</Link>
                  : <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{crumb.label}</span>
                }
              </span>
            ))
          : <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>{title}</span>
        }
      </div>

      {/* ── Raccourcis droite ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* Bouton nouveau client (visible partout sauf sur new) */}
        {!pathname.includes('/new') && !pathname.includes('/edit') && (
          <Link
            href="/clients/new"
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, border: '0.5px solid var(--color-border-secondary)', fontSize: 12, color: 'var(--color-text-secondary)', background: 'var(--color-background-primary)' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Nouveau client
          </Link>
        )}

        {/* Avatar / initiales (solo = pas d'auth complexe) */}
        <div
          title="Ton compte"
          style={{ width: 28, height: 28, borderRadius: '50%', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 500, color: '#185FA5', cursor: 'pointer', flexShrink: 0 }}
        >
          WP
        </div>
      </div>

    </header>
  )
}
