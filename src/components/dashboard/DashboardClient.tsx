'use client'

import { useState, useEffect, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { EcheanceAlert, DashboardStats } from '@/types'
import type { DashboardChartsData } from '@/lib/supabase/charts'

interface Props {
  stats: DashboardStats
  echeances: EcheanceAlert[]
  chartsData: DashboardChartsData
}

type Filter = 'all' | 'prestation' | 'plugin' | 'urgent'

// ─── Helpers ───────────────────────────────────────────────────────────────
function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}
function fmtDate(s: string) {
  return format(parseISO(s), 'd MMM yyyy', { locale: fr })
}
function urgencyColor(days: number): string {
  if (days <= 7)  return '#E24B4A'
  if (days <= 15) return '#BA7517'
  return '#639922'
}
function urgencyBadge(days: number): { bg: string; color: string; text: string } {
  if (days < 0)   return { bg: '#FCEBEB', color: '#A32D2D', text: 'Expiré' }
  if (days <= 7)  return { bg: '#FCEBEB', color: '#A32D2D', text: `${days} j` }
  if (days <= 15) return { bg: '#FAEEDA', color: '#854F0B', text: `${days} j` }
  return           { bg: '#EAF3DE', color: '#3B6D11', text: `${days} j` }
}

// ─── Composant principal ───────────────────────────────────────────────────
export default function DashboardClient({ stats, echeances, chartsData }: Props) {
  const [filter, setFilter] = useState<Filter>('all')

  const expired   = echeances.filter(e => e.jours_restants < 0).length
  const urgent    = echeances.filter(e => e.jours_restants >= 0 && e.jours_restants <= 7).length

  const filtered = echeances.filter(e => {
    if (filter === 'prestation') return e.type === 'prestation'
    if (filter === 'plugin')     return e.type === 'plugin'
    if (filter === 'urgent')     return e.jours_restants <= 7
    return true
  })

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 1rem' }}>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 10, marginBottom: 16 }}>
        <KPI label="Clients actifs"    value={stats.total_clients.toString()}            sub="sites gérés" />
        <KPI label="MRR"               value={fmt(stats.mrr)}                            sub="revenus mensuels" />
        <KPI label="Échéances J-15"    value={stats.echeances_15j.toString()}            sub="à renouveler" color={stats.echeances_15j > 0 ? '#A32D2D' : undefined} />
        <KPI label="Licences expirées" value={expired.toString()}                        sub="action requise"   color={expired > 0 ? '#854F0B' : undefined} />
      </div>

      {/* ── Charts row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: 12, marginBottom: 12 }}>
        <MRRChart data={chartsData.mrr_mensuel} />
        <HebergeurChart data={chartsData.hebergeurs} />
      </div>

      {/* ── Échéances ── */}
      <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--color-text-secondary)' }}>
            Échéances à venir
          </p>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            {filtered.length} entrée{filtered.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {(['all', 'prestation', 'plugin', 'urgent'] as Filter[]).map(f => (
            <FilterBtn key={f} label={f === 'all' ? 'Tout' : f === 'urgent' ? 'Urgent (<7j)' : f.charAt(0).toUpperCase() + f.slice(1)} active={filter === f} onClick={() => setFilter(f)} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', padding: '12px 0' }}>Aucune échéance dans cette catégorie.</p>
        )}

        {filtered.map((e, i) => {
          const badge = urgencyBadge(e.jours_restants)
          const barColor = urgencyColor(e.jours_restants)
          const isPrestation = e.type === 'prestation'
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 12, alignItems: 'center', padding: '8px 0', borderBottom: i < filtered.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
              <div style={{ width: 4, height: 36, borderRadius: 2, background: barColor, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 2 }}>{e.nom_projet}</p>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  {e.nom_item ?? 'Maintenance mensuelle'} — {e.nom_domaine}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: isPrestation ? '#E6F1FB' : '#F1EFE8', color: isPrestation ? '#185FA5' : '#5F5E5A', marginBottom: 4 }}>
                  {isPrestation ? 'Prestation' : 'Plugin'}
                </span>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{fmtDate(e.date_echeance)}</p>
              </div>
              <div style={{ textAlign: 'right', minWidth: 60 }}>
                <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: badge.bg, color: badge.color }}>
                  {badge.text}
                </span>
                {e.montant && <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>{fmt(e.montant)}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Sous-composants ────────────────────────────────────────────────────────
function KPI({ label, value, sub, color }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div style={{ background: 'var(--color-background-secondary)', borderRadius: 8, padding: '12px 14px' }}>
      <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 5 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 500, lineHeight: 1, color: color ?? 'var(--color-text-primary)' }}>{value}</p>
      <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>{sub}</p>
    </div>
  )
}

function FilterBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
        border: `0.5px solid ${active ? 'var(--color-text-primary)' : 'var(--color-border-secondary)'}`,
        background: active ? 'var(--color-text-primary)' : 'var(--color-background-primary)',
        color: active ? 'var(--color-background-primary)' : 'var(--color-text-secondary)',
      }}
    >{label}</button>
  )
}

// ─── Palette donut hébergeurs ──────────────────────────────────────────────
const DONUT_COLORS = ['#185FA5', '#5DCAA5', '#EF9F27', '#D3D1C7', '#AFA9EC', '#F0997B', '#97C459', '#D4537E']

// ─── Graphique MRR (données Supabase réelles) ──────────────────────────────
function MRRChart({ data }: { data: import('@/lib/supabase/charts').MrrMensuel[] }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!data.length) return
    let chart: any
    import('chart.js/auto').then(({ Chart }) => {
      if (!ref.current) return
      chart = new Chart(ref.current, {
        type: 'bar',
        data: {
          labels: data.map(d => d.mois_label),
          datasets: [
            {
              label: 'Revenus',
              data: data.map(d => Math.round(d.total)),
              backgroundColor: '#185FA5',
              borderRadius: 3,
            },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#888780' } },
            y: {
              grid: { color: 'rgba(136,135,128,0.15)' },
              ticks: {
                font: { size: 11 },
                color: '#888780',
                callback: (v: any) => v >= 1000 ? `${(v / 1000).toFixed(0)}k €` : `${v} €`,
              },
              border: { display: false },
            },
          },
        },
      })
    })
    return () => chart?.destroy()
  }, [data])

  // Dernier MRR connu
  const lastMrr = data.length ? Math.round(data[data.length - 1].total) : 0
  const prevMrr = data.length > 1 ? Math.round(data[data.length - 2].total) : 0
  const delta = lastMrr - prevMrr

  return (
    <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--color-text-secondary)' }}>MRR — 6 derniers mois</p>
        {delta !== 0 && (
          <span style={{ fontSize: 11, color: delta > 0 ? '#3B6D11' : '#A32D2D', background: delta > 0 ? '#EAF3DE' : '#FCEBEB', padding: '2px 7px', borderRadius: 20, fontWeight: 500 }}>
            {delta > 0 ? '+' : ''}{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(delta)} vs mois préc.
          </span>
        )}
      </div>
      {data.length === 0
        ? <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', padding: '20px 0' }}>Aucun historique disponible — les données apparaîtront au fur et à mesure des renouvellements.</p>
        : <div style={{ position: 'relative', height: 160 }}><canvas ref={ref} /></div>
      }
    </div>
  )
}

// ─── Graphique hébergeurs (données Supabase réelles) ───────────────────────
function HebergeurChart({ data }: { data: import('@/lib/supabase/charts').HebergeurStat[] }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!data.length) return
    let chart: any
    import('chart.js/auto').then(({ Chart }) => {
      if (!ref.current) return
      chart = new Chart(ref.current, {
        type: 'doughnut',
        data: {
          labels: data.map(d => d.hebergeur),
          datasets: [{
            data: data.map(d => d.nb_sites),
            backgroundColor: data.map((_, i) => DONUT_COLORS[i % DONUT_COLORS.length]),
            borderWidth: 0,
            hoverOffset: 4,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '68%',
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx: any) => `${ctx.label} : ${ctx.parsed} sites (${data[ctx.dataIndex]?.pct ?? 0}%)` } },
          },
        },
      })
    })
    return () => chart?.destroy()
  }, [data])

  return (
    <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '1rem' }}>
      <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--color-text-secondary)', marginBottom: 8 }}>Répartition hébergeurs</p>
      {data.length === 0
        ? <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Aucune donnée.</p>
        : <>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10, fontSize: 11, color: 'var(--color-text-secondary)' }}>
              {data.slice(0, 5).map((d, i) => (
                <span key={d.hebergeur} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: DONUT_COLORS[i % DONUT_COLORS.length], display: 'inline-block' }} />
                  {d.hebergeur} {d.pct}%
                </span>
              ))}
            </div>
            <div style={{ position: 'relative', height: 140 }}><canvas ref={ref} /></div>
          </>
      }
    </div>
  )
}
