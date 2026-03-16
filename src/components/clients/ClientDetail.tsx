'use client'

import { useState } from 'react'
import { format, differenceInDays, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Client, Site, Plugin, HistoriqueRenouvellement } from '@/types'
import { HistoriqueList } from './AddRenouvellement'

// ─── Types locaux ──────────────────────────────────────────────────────────
interface ClientDetailProps {
  client: Client & {
    sites: (Site & {
      plugins: Plugin[]
      historique_renouvellements: HistoriqueRenouvellement[]
    })[]
  }
}

type TabId = 'infos' | 'plugins' | 'historique'

// ─── Helpers ───────────────────────────────────────────────────────────────
function getDaysUntil(dateStr: string): number {
  return differenceInDays(parseISO(dateStr), new Date())
}

function getStatusBadge(days: number) {
  if (days < 0)  return { label: 'Expiré',   class: 'badge-danger' }
  if (days <= 7)  return { label: `${days} j`, class: 'badge-danger' }
  if (days <= 15) return { label: `${days} j`, class: 'badge-warn'   }
  return           { label: 'OK',             class: 'badge-ok'     }
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'd MMM yyyy', { locale: fr })
}

function formatEuro(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount)
}

// ─── Composant principal ───────────────────────────────────────────────────
export default function ClientDetail({ client }: ClientDetailProps) {
  const [activeTab, setActiveTab] = useState<TabId>('infos')
  const [pdfLoading, setPdfLoading] = useState(false)

  // On prend le premier site (1 client = 1 site dans notre modèle)
  const site = client.sites[0]
  if (!site) return <div className="text-muted">Aucun site associé.</div>

  const plugins = site.plugins ?? []
  const historique = site.historique_renouvellements ?? []

  // KPIs
  const coutMensuel = site.cout_mensuel
  const coutLicencesAnnuel = plugins.reduce((sum, p) => sum + p.cout, 0)
  const daysUntilPrestation = getDaysUntil(site.date_renouvellement_prestation)
  const nextEcheance = Math.min(
    daysUntilPrestation,
    ...plugins.map(p => getDaysUntil(p.date_renouvellement))
  )

  return (
    <div className="client-detail">

      {/* ── Header ── */}
      <div className="header-bar">
        <div className="header-left">
          <div className="avatar">{getInitials(client.nom_projet)}</div>
          <div>
            <h1 className="project-name">{client.nom_projet}</h1>
            <p className="domain">{site.nom_domaine}</p>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="btn"
            disabled={pdfLoading}
            onClick={async () => {
              setPdfLoading(true)
              try {
                const res = await fetch(`/api/clients/${client.id}/pdf`)
                const blob = await res.blob()
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${client.nom_projet.toLowerCase().replace(/[^a-z0-9]/g, '-')}-fiche.pdf`
                a.click()
                URL.revokeObjectURL(url)
              } finally {
                setPdfLoading(false)
              }
            }}
          >
            {pdfLoading ? 'Génération…' : 'Exporter PDF'}
          </button>
          <button className="btn btn-primary" onClick={() => window.location.href = `/clients/${client.id}/edit`}>Modifier</button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="stats-row">
        <div className="stat-card">
          <p className="stat-label">Coût mensuel</p>
          <p className="stat-value">{formatEuro(coutMensuel)}</p>
          <p className="stat-sub">prestation maintenance</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Licences / an</p>
          <p className="stat-value">{formatEuro(coutLicencesAnnuel)}</p>
          <p className="stat-sub">{plugins.length} plugins actifs</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Prochaine échéance</p>
          <p className={`stat-value ${nextEcheance <= 15 ? 'text-danger' : ''}`}>
            {nextEcheance < 0 ? 'Expiré' : `${nextEcheance} j`}
          </p>
          <p className="stat-sub">
            {daysUntilPrestation === nextEcheance ? 'renouvellement prestation' : 'licence plugin'}
          </p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="tabs">
        {(['infos', 'plugins', 'historique'] as TabId[]).map(tab => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'plugins' ? `Plugins (${plugins.length})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Tab: Infos ── */}
      {activeTab === 'infos' && (
        <div className="section-card">
          <p className="section-title">Hébergement & domaine</p>
          <FieldRow label="Hébergeur"         value={site.hebergeur} />
          <FieldRow label="Nom de domaine"    value={site.nom_domaine} />
          <FieldRow label="Adresses mail"     value={`${site.nbr_adresses_mail} adresse${site.nbr_adresses_mail > 1 ? 's' : ''}`} />
          <FieldRow label="Répertoire WP"     value={client.repertoire_wp} mono />
          <FieldRow
            label="Renouvellement prestation"
            value={formatDate(site.date_renouvellement_prestation)}
            badge={getStatusBadge(daysUntilPrestation)}
          />

          <p className="section-title" style={{ marginTop: '1.25rem' }}>Contact client</p>
          <FieldRow label="Email"     value={client.contact_mail} link={`mailto:${client.contact_mail}`} />
          <FieldRow label="Téléphone" value={client.contact_tel} />
        </div>
      )}

      {/* ── Tab: Plugins ── */}
      {activeTab === 'plugins' && (
        <div className="section-card">
          <p className="section-title">Licences & plugins</p>
          <div className="plugin-header">
            <span>Plugin</span>
            <span>Prix/an</span>
            <span>Expiration</span>
            <span>Statut</span>
          </div>
          {plugins.map(plugin => {
            const days = getDaysUntil(plugin.date_renouvellement)
            const badge = getStatusBadge(days)
            return (
              <div key={plugin.id} className="plugin-row">
                <div>
                  <p className="plugin-name">{plugin.nom}</p>
                  {plugin.fournisseur && <p className="plugin-vendor">{plugin.fournisseur}</p>}
                </div>
                <p className="plugin-cost">{formatEuro(plugin.cout)}</p>
                <p className={`plugin-date ${days <= 15 ? 'text-warn' : 'text-muted'}`}>
                  {formatDate(plugin.date_renouvellement)}
                </p>
                <span className={`badge ${badge.class}`}>{badge.label}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Tab: Historique ── */}
      {activeTab === 'historique' && (
        <div className="section-card">
          <HistoriqueList
            clientId={client.id}
            initialEntries={historique}
          />
        </div>
      )}

    </div>
  )
}

// ─── Sous-composant FieldRow ───────────────────────────────────────────────
function FieldRow({
  label, value, mono = false, link, badge
}: {
  label: string
  value: string
  mono?: boolean
  link?: string
  badge?: { label: string; class: string }
}) {
  return (
    <div className="field-row">
      <span className="field-label">{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {badge && <span className={`badge ${badge.class}`}>{badge.label}</span>}
        {link
          ? <a href={link} className="field-value link">{value}</a>
          : <span className={`field-value ${mono ? 'mono' : ''}`}>{value}</span>
        }
      </div>
    </div>
  )
}
