'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// ─── Icônes SVG inline ─────────────────────────────────────────────────────
const icons = {
  dashboard: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  clients:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/></svg>,
  calendar:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  import:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  export:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  settings:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
}

// ─── Structure de navigation ────────────────────────────────────────────────
const NAV = [
  {
    section: 'Principal',
    items: [
      { label: 'Dashboard',  href: '/dashboard', icon: icons.dashboard },
      { label: 'Clients',    href: '/clients',   icon: icons.clients   },
    ],
  },
  {
    section: 'Maintenance',
    items: [
      { label: 'Échéances',     href: '/dashboard#echeances', icon: icons.calendar, badge: null },
      { label: 'Import Sheets', href: '/import',              icon: icons.import    },
    ],
  },
  {
    section: 'Finance',
    items: [
      { label: 'Export CSV', href: '/export', icon: icons.export },
    ],
  },
]

// ─── Composant Sidebar ─────────────────────────────────────────────────────
export default function Sidebar() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href.includes('#')) return pathname === href.split('#')[0]
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside style={{ width: 210, flexShrink: 0, background: 'var(--color-background-primary)', borderRight: '0.5px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Logo ── */}
      <div style={{ padding: '14px 14px 12px', borderBottom: '0.5px solid var(--color-border-tertiary)', display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>WP Maintenance</span>
      </div>

      {/* ── Navigation ── */}
      <nav style={{ flex: 1, padding: '8px 8px', overflowY: 'auto' }}>
        {NAV.map(group => (
          <div key={group.section} style={{ marginBottom: 4 }}>
            <p style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--color-text-tertiary)', padding: '10px 10px 4px' }}>
              {group.section}
            </p>
            {group.items.map(item => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: '7px 10px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: active ? 500 : 400,
                    color: active ? '#185FA5' : 'var(--color-text-secondary)',
                    background: active ? '#E6F1FB' : 'transparent',
                    marginBottom: 1,
                    transition: 'background 0.1s, color 0.1s',
                  }}
                  onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'var(--color-background-secondary)'; (e.currentTarget as HTMLElement).style.color = 'var(--color-text-primary)' } }}
                  onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)' } }}
                >
                  <span style={{ flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* ── Footer : paramètres ── */}
      <div style={{ padding: '8px 8px 12px', borderTop: '0.5px solid var(--color-border-tertiary)' }}>
        <Link
          href="/settings"
          style={{
            display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 8,
            fontSize: 13, color: isActive('/settings') ? '#185FA5' : 'var(--color-text-secondary)',
            background: isActive('/settings') ? '#E6F1FB' : 'transparent',
          }}
        >
          {icons.settings}
          Paramètres
        </Link>
      </div>

    </aside>
  )
}
