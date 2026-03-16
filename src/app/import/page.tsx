'use client'

import { useState } from 'react'
import type { ImportPreview } from '@/types'

type Step = 0 | 1 | 2 | 3

interface ImportStats {
  total: number
  valid: number
  warnings: number
  duplicates: number
}

interface ImportResult {
  imported: number
  skipped: number
  errors: string[]
}

// ─── Composant principal ───────────────────────────────────────────────────
export default function ImportPage() {
  const [step, setStep]         = useState<Step>(0)
  const [sheetUrl, setSheetUrl] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [previews, setPreviews] = useState<ImportPreview[]>([])
  const [stats, setStats]       = useState<ImportStats | null>(null)
  const [result, setResult]     = useState<ImportResult | null>(null)

  // ── Étape 0 → 1 : connexion Google + fetch preview ──────────────────────
  async function handleFetchPreview() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/import/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sheetUrl }),
      })
      if (res.status === 401) {
        // Pas encore authentifié → redirige vers OAuth Google
        window.location.href = '/api/auth/google'
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPreviews(data.previews)
      setStats(data.stats)
      setStep(2) // on saute le mapping (auto-détecté)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Étape 2 → 3 : lancer l'import ────────────────────────────────────────
  async function handleImport() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/import/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previews }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
      setStep(3)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '2rem 1rem' }}>

      {/* ── Stepper ── */}
      <Stepper current={step} />

      {/* ── Erreur globale ── */}
      {error && (
        <div style={{ background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#A32D2D' }}>
          {error}
        </div>
      )}

      {/* ── Étape 0 : saisie URL ── */}
      {step === 0 && (
        <div>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
            Colle l'URL de ton Google Sheets. L'accès est en lecture seule.
          </p>
          <input
            type="text"
            placeholder="https://docs.google.com/spreadsheets/d/..."
            value={sheetUrl}
            onChange={e => setSheetUrl(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', fontSize: 13, fontFamily: 'var(--font-mono)', marginBottom: 12, background: 'var(--color-background-primary)', color: 'var(--color-text-primary)' }}
          />
          <button
            onClick={handleFetchPreview}
            disabled={!sheetUrl || loading}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#185FA5', color: '#fff', fontSize: 13, cursor: sheetUrl ? 'pointer' : 'not-allowed', opacity: sheetUrl ? 1 : 0.5 }}
          >
            {loading ? 'Chargement…' : 'Analyser le Sheet'}
          </button>
        </div>
      )}

      {/* ── Étape 2 : aperçu ── */}
      {step === 2 && stats && (
        <div>
          <ImportStatsBar stats={stats} />
          <PreviewTable previews={previews} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <button onClick={() => setStep(0)} style={{ padding: '8px 18px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 13, cursor: 'pointer' }}>
              Retour
            </button>
            <button
              onClick={handleImport}
              disabled={loading || stats.valid === 0}
              style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#185FA5', color: '#fff', fontSize: 13, cursor: 'pointer' }}
            >
              {loading ? 'Import en cours…' : `Importer ${stats.valid} client${stats.valid > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}

      {/* ── Étape 3 : résultat ── */}
      {step === 3 && result && (
        <ImportResultView result={result} />
      )}
    </div>
  )
}

// ─── Sous-composants ────────────────────────────────────────────────────────

function Stepper({ current }: { current: number }) {
  const steps = ['Connexion', 'Mapping', 'Aperçu', 'Résultat']
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 500,
              background: i < current ? '#EAF3DE' : i === current ? '#E6F1FB' : 'var(--color-background-secondary)',
              color: i < current ? '#3B6D11' : i === current ? '#185FA5' : 'var(--color-text-secondary)',
            }}>
              {i < current ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: 11, color: i === current ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', fontWeight: i === current ? 500 : 400, whiteSpace: 'nowrap' }}>
              {s}
            </span>
          </div>
          {i < steps.length - 1 && <div style={{ flex: 1, height: 1, background: 'var(--color-border-tertiary)', margin: '0 4px', marginBottom: 18 }} />}
        </div>
      ))}
    </div>
  )
}

function ImportStatsBar({ stats }: { stats: ImportStats }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
      {[
        { label: 'total', value: stats.total, color: 'var(--color-text-primary)', bg: 'var(--color-background-secondary)' },
        { label: 'valides', value: stats.valid, color: '#3B6D11', bg: '#EAF3DE' },
        { label: 'avertissements', value: stats.warnings, color: '#854F0B', bg: '#FAEEDA' },
        { label: 'doublons', value: stats.duplicates, color: '#5F5E5A', bg: '#F1EFE8' },
      ].map(({ label, value, color, bg }) => (
        <div key={label} style={{ background: bg, borderRadius: 8, padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 500, color }}>{value}</div>
          <div style={{ fontSize: 11, color }}>{label}</div>
        </div>
      ))}
    </div>
  )
}

function PreviewTable({ previews }: { previews: ImportPreview[] }) {
  return (
    <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ background: 'var(--color-background-secondary)' }}>
              {['Projet', 'Domaine', 'Hébergeur', 'Plugins', 'Statut'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 500, fontSize: 11, color: 'var(--color-text-secondary)', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previews.map((p, i) => {
              const hasError = p.errors.length > 0
              const status = p.isDuplicate ? 'dup' : hasError ? 'err' : 'ok'
              const badge = { ok: { bg: '#EAF3DE', color: '#3B6D11', text: 'OK' }, err: { bg: '#FCEBEB', color: '#A32D2D', text: 'Erreur' }, dup: { bg: '#F1EFE8', color: '#5F5E5A', text: 'Doublon' } }[status]
              return (
                <tr key={i} title={p.errors.join(' | ')} style={{ background: status === 'err' ? '#FCEBEB22' : status === 'dup' ? '#F1EFE822' : 'transparent' }}>
                  <td style={{ padding: '7px 10px', borderBottom: '0.5px solid var(--color-border-tertiary)', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.parsed.client.nom_projet}</td>
                  <td style={{ padding: '7px 10px', borderBottom: '0.5px solid var(--color-border-tertiary)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.parsed.site.nom_domaine}</td>
                  <td style={{ padding: '7px 10px', borderBottom: '0.5px solid var(--color-border-tertiary)', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.parsed.site.hebergeur}</td>
                  <td style={{ padding: '7px 10px', borderBottom: '0.5px solid var(--color-border-tertiary)', color: 'var(--color-text-secondary)', textAlign: 'center' }}>{p.parsed.plugins.length}</td>
                  <td style={{ padding: '7px 10px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                    <span style={{ background: badge.bg, color: badge.color, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>{badge.text}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ImportResultView({ result }: { result: ImportResult }) {
  return (
    <div>
      <div style={{ background: '#EAF3DE', border: '0.5px solid #C0DD97', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: '#3B6D11', marginBottom: 4 }}>Import terminé</p>
        <p style={{ fontSize: 12, color: '#3B6D11' }}>{result.imported} client{result.imported > 1 ? 's' : ''} importé{result.imported > 1 ? 's' : ''} avec succès.</p>
      </div>
      {result.errors.length > 0 && (
        <div style={{ background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: 12, padding: '1rem 1.25rem' }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: '#A32D2D', marginBottom: 8 }}>Lignes ignorées :</p>
          {result.errors.map((e, i) => <p key={i} style={{ fontSize: 12, color: '#A32D2D', marginBottom: 4 }}>— {e}</p>)}
        </div>
      )}
      <a href="/clients" style={{ display: 'inline-block', marginTop: 16, padding: '8px 20px', background: '#185FA5', color: '#fff', borderRadius: 8, fontSize: 13, textDecoration: 'none' }}>
        Voir les clients →
      </a>
    </div>
  )
}
