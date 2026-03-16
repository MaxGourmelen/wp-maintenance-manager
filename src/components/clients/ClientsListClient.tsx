'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { differenceInDays, parseISO } from 'date-fns'

// ─── Types locaux ──────────────────────────────────────────────────────────
interface ClientRow {
  id: string
  nom_projet: string
  contact_mail: string
  sites: {
    nom_domaine: string
    hebergeur: string
    cout_mensuel: number
    date_renouvellement_prestation: string
    plugins: { id: string }[]
  }[]
}

type SortField = 'nom' | 'echeance' | 'cout' | 'hebergeur'
type EcheanceFilter = '' | 'urgent' | 'soon' | 'ok'

interface Props { clients: ClientRow[] }

const PER_PAGE = 15

// ─── Helpers ───────────────────────────────────────────────────────────────
function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function getDays(dateStr: string): number {
  if (!dateStr) return 999
  return differenceInDays(parseISO(dateStr), new Date())
}

function urgencyBadge(days: number) {
  if (days < 0)   return { bg: '#FCEBEB', color: '#A32D2D', text: 'Expiré' }
  if (days <= 7)  return { bg: '#FCEBEB', color: '#A32D2D', text: `${days}j` }
  if (days <= 15) return { bg: '#FAEEDA', color: '#854F0B', text: `${days}j` }
  return           { bg: '#EAF3DE', color: '#3B6D11', text: `${days}j` }
}

// ─── Composant principal ───────────────────────────────────────────────────
export default function ClientsListClient({ clients }: Props) {
  const router = useRouter()
  const [query, setQuery]         = useState('')
  const [fHebergeur, setFHeb]     = useState('')
  const [fEcheance, setFEch]      = useState<EcheanceFilter>('')
  const [sortField, setSortField] = useState<SortField>('nom')
  const [sortDir, setSortDir]     = useState<1 | -1>(1)
  const [page, setPage]           = useState(0)

  // Déduire la liste unique des hébergeurs
  const hebergeurs = useMemo(() => {
    const set = new Set(clients.flatMap(c => c.sites.map(s => s.hebergeur).filter(Boolean)))
    return Array.from(set).sort()
  }, [clients])

  // Enrichissement : calculer les jours avant échéance par client
  const enriched = useMemo(() => clients.map(c => {
    const site = c.sites[0]
    return {
      ...c,
      site,
      jours: site ? getDays(site.date_renouvellement_prestation) : 999,
      cout: site?.cout_mensuel ?? 0,
      plugins: site?.plugins?.length ?? 0,
      domaine: site?.nom_domaine ?? '',
      hebergeur: site?.hebergeur ?? '',
    }
  }), [clients])

  // Filtrage + tri
  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    let data = enriched.filter(c => {
      const matchQ = !q || c.nom_projet.toLowerCase().includes(q) || c.domaine.toLowerCase().includes(q) || c.hebergeur.toLowerCase().includes(q) || c.contact_mail.toLowerCase().includes(q)
      const matchH = !fHebergeur || c.hebergeur === fHebergeur
      const matchE = !fEcheance
        || (fEcheance === 'urgent' && c.jours <= 7)
        || (fEcheance === 'soon'   && c.jours <= 15)
        || (fEcheance === 'ok'     && c.jours > 15)
      return matchQ && matchH && matchE
    })

    data.sort((a, b) => {
      let cmp = 0
      if (sortField === 'nom')       cmp = a.nom_projet.localeCompare(b.nom_projet)
      if (sortField === 'echeance')  cmp = a.jours - b.jours
      if (sortField === 'cout')      cmp = a.cout - b.cout
      if (sortField === 'hebergeur') cmp = a.hebergeur.localeCompare(b.hebergeur)
      return sortDir * cmp
    })

    return data
  }, [enriched, query, fHebergeur, fEcheance, sortField, sortDir])

  const pages    = Math.ceil(filtered.length / PER_PAGE)
  const pageData = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE)

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === 1 ? -1 : 1)
    else { setSortField(field); setSortDir(1) }
    setPage(0)
  }

  function handleFilter() { setPage(0) }

  const SortArrow = ({ field }: { field: SortField }) => (
    <span style={{ marginLeft: 3, opacity: sortField === field ? 1 : 0.3, fontSize: 10 }}>
      {sortField === field ? (sortDir === 1 ? '↑' : '↓') : '↕'}
    </span>
  )

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1rem' }}>

      {/* ── Barre de recherche + filtres ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>

        {/* Recherche */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, opacity: 0.4 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher un client, domaine, hébergeur…"
            value={query}
            onChange={e => { setQuery(e.target.value); handleFilter() }}
            style={{ width: '100%', padding: '8px 12px 8px 34px', border: '0.5px solid var(--color-border-secondary)', borderRadius: 8, fontSize: 13, color: 'var(--color-text-primary)', background: 'var(--color-background-primary)' }}
          />
        </div>

        {/* Filtre hébergeur */}
        <select value={fHebergeur} onChange={e => { setFHeb(e.target.value); handleFilter() }}
          style={{ padding: '7px 10px', border: '0.5px solid var(--color-border-secondary)', borderRadius: 8, fontSize: 12, color: 'var(--color-text-primary)', background: 'var(--color-background-primary)', cursor: 'pointer' }}>
          <option value="">Tous les hébergeurs</option>
          {hebergeurs.map(h => <option key={h}>{h}</option>)}
        </select>

        {/* Filtre échéance */}
        <select value={fEcheance} onChange={e => { setFEch(e.target.value as EcheanceFilter); handleFilter() }}
          style={{ padding: '7px 10px', border: '0.5px solid var(--color-border-secondary)', borderRadius: 8, fontSize: 12, color: 'var(--color-text-primary)', background: 'var(--color-background-primary)', cursor: 'pointer' }}>
          <option value="">Toutes les échéances</option>
          <option value="urgent">Urgent (&lt;7j)</option>
          <option value="soon">Bientôt (&lt;15j)</option>
          <option value="ok">OK</option>
        </select>

        {/* Bouton nouveau client */}
        <button
          onClick={() => router.push('/clients/new')}
          style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#185FA5', color: '#fff', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          + Nouveau client
        </button>
      </div>

      {/* ── Chips filtres actifs ── */}
      {(fHebergeur || fEcheance) && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {fHebergeur && (
            <Chip label={fHebergeur} onRemove={() => { setFHeb(''); handleFilter() }} />
          )}
          {fEcheance && (
            <Chip label={fEcheance === 'urgent' ? 'Urgent (<7j)' : fEcheance === 'soon' ? 'Bientôt (<15j)' : 'OK'} onRemove={() => { setFEch(''); handleFilter() }} />
          )}
        </div>
      )}

      {/* ── Table ── */}
      <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, overflow: 'hidden' }}>

        {/* En-tête */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1.5fr) minmax(0,1fr) minmax(0,1fr) minmax(0,80px) 28px', gap: 10, padding: '7px 14px', borderBottom: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)' }}>
          {([['nom', 'Client'], ['hebergeur', 'Hébergeur'], ['cout', 'Coût / mois'], ['echeance', 'Échéance']] as [SortField, string][]).map(([field, label], i) => (
            <span key={field} onClick={() => handleSort(field)} style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', cursor: 'pointer', userSelect: 'none', gridColumn: i === 0 ? 'span 1' : undefined }}>
              {label}<SortArrow field={field} />
            </span>
          ))}
          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Plugins</span>
          <span />
        </div>

        {/* Lignes */}
        {pageData.length === 0
          ? <div style={{ padding: '2rem', textAlign: 'center', fontSize: 13, color: 'var(--color-text-secondary)' }}>Aucun client ne correspond à ces filtres.</div>
          : pageData.map(c => {
              const badge = urgencyBadge(c.jours)
              return (
                <div
                  key={c.id}
                  onClick={() => router.push(`/clients/${c.id}`)}
                  style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1.5fr) minmax(0,1fr) minmax(0,1fr) minmax(0,80px) 28px', gap: 10, alignItems: 'center', padding: '9px 14px', borderBottom: '0.5px solid var(--color-border-tertiary)', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-background-secondary)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 500, color: '#185FA5', flexShrink: 0 }}>
                      {getInitials(c.nom_projet)}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nom_projet}</p>
                      <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.domaine}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.hebergeur}</p>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{c.cout} €</p>
                  <div>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: badge.bg, color: badge.color }}>
                      {badge.text}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{c.plugins} plugin{c.plugins > 1 ? 's' : ''}</p>
                  <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', textAlign: 'right' }}>›</p>
                </div>
              )
            })
        }
      </div>

      {/* ── Footer : compteur + pagination ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {filtered.length} client{filtered.length > 1 ? 's' : ''}
        </span>
        {pages > 1 && (
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: pages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)}
                style={{ width: 28, height: 28, borderRadius: 6, border: '0.5px solid var(--color-border-secondary)', fontSize: 12, cursor: 'pointer', background: i === page ? 'var(--color-text-primary)' : 'var(--color-background-primary)', color: i === page ? 'var(--color-background-primary)' : 'var(--color-text-secondary)' }}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

// ─── Chip filtre actif ─────────────────────────────────────────────────────
function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 4, fontSize: 11, background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-secondary)', color: 'var(--color-text-secondary)' }}>
      {label}
      <span onClick={onRemove} style={{ cursor: 'pointer', opacity: 0.6, fontSize: 10, marginLeft: 2 }}>✕</span>
    </span>
  )
}
