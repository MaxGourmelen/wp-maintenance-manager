'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { HistoriqueRenouvellement, TypeRenouvellement } from '@/types'

// ─── Types ─────────────────────────────────────────────────────────────────
interface Props {
  clientId: string
  onAdded: (entry: HistoriqueRenouvellement) => void
}

const TYPE_OPTIONS: { value: TypeRenouvellement; label: string }[] = [
  { value: 'prestation',   label: 'Prestation'   },
  { value: 'plugin',       label: 'Plugin'        },
  { value: 'domaine',      label: 'Domaine'       },
  { value: 'hebergement',  label: 'Hébergement'   },
]

const TYPE_HINTS: Record<TypeRenouvellement, string> = {
  prestation:  'ex : mois de mars, contrat annuel',
  plugin:      'nom du plugin renouvelé',
  domaine:     'domaine renouvelé',
  hebergement: 'hébergeur, durée',
}

const TYPE_BADGE: Record<TypeRenouvellement, { bg: string; color: string }> = {
  prestation:  { bg: '#E6F1FB', color: '#185FA5' },
  plugin:      { bg: '#EAF3DE', color: '#3B6D11' },
  domaine:     { bg: '#FAEEDA', color: '#854F0B' },
  hebergement: { bg: '#F1EFE8', color: '#5F5E5A' },
}

// ─── Composant AddRenouvellement ───────────────────────────────────────────
export default function AddRenouvellement({ clientId, onAdded }: Props) {
  const [open, setOpen] = useState(false)
  const [type, setType]     = useState<TypeRenouvellement>('prestation')
  const [date, setDate]     = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes]   = useState('')
  const [montant, setMontant] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  async function handleSave() {
    if (!date) { setError('Date requise'); return }
    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/clients/${clientId}/renouvellements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date_renouvellement: date,
          type,
          montant: parseFloat(montant) || 0,
          notes: notes.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      onAdded(data)
      setOpen(false)
      setNotes('')
      setMontant('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 11px',
    border: '0.5px solid var(--color-border-secondary)',
    borderRadius: 8, fontSize: 13,
    color: 'var(--color-text-primary)',
    background: 'var(--color-background-primary)',
  }

  return (
    <div>
      {/* ── Bouton d'ouverture ── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, width: '100%', padding: '9px 14px', borderRadius: 8, border: '0.5px dashed var(--color-border-secondary)', background: 'transparent', fontSize: 12, color: 'var(--color-text-secondary)', cursor: 'pointer', justifyContent: 'center', marginTop: 4 }}
        >
          <span style={{ fontSize: 15 }}>+</span> Ajouter un renouvellement
        </button>
      )}

      {/* ── Formulaire inline ── */}
      {open && (
        <div style={{ marginTop: 12, padding: '1rem 1.25rem', background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 10, borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>Nouveau renouvellement</p>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '2px 6px' }}>✕</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Type */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 5 }}>
                Type <span style={{ color: '#E24B4A' }}>*</span>
              </label>
              <select value={type} onChange={e => setType(e.target.value as TypeRenouvellement)} style={{ ...inp, cursor: 'pointer' }}>
                {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Date */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 5 }}>
                Date <span style={{ color: '#E24B4A' }}>*</span>
              </label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp} />
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 5 }}>
              Notes <span style={{ fontWeight: 400, opacity: 0.7 }}>— {TYPE_HINTS[type]}</span>
            </label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Facultatif" style={inp} />
          </div>

          {/* Montant */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 5 }}>Montant (€)</label>
            <input type="number" value={montant} onChange={e => setMontant(e.target.value)} min="0" placeholder="0" style={{ ...inp, width: 160 }} />
          </div>

          {/* Erreur */}
          {error && (
            <div style={{ padding: '8px 12px', borderRadius: 7, background: '#FCEBEB', color: '#A32D2D', fontSize: 12, marginBottom: 10 }}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 12, borderTop: '0.5px solid var(--color-border-tertiary)' }}>
            <button onClick={() => setOpen(false)} style={{ padding: '7px 16px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', fontSize: 13, cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#185FA5', color: '#fff', fontSize: 13, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Composant HistoriqueList (liste + ajout intégré) ─────────────────────
export function HistoriqueList({
  clientId,
  initialEntries,
}: {
  clientId: string
  initialEntries: HistoriqueRenouvellement[]
}) {
  const [entries, setEntries] = useState<HistoriqueRenouvellement[]>(
    [...initialEntries].sort((a, b) => b.date_renouvellement.localeCompare(a.date_renouvellement))
  )

  function handleAdded(entry: HistoriqueRenouvellement) {
    setEntries(prev => [entry, ...prev])
  }

  const typeLabel = (t: TypeRenouvellement) =>
    ({ prestation: 'Prestation', plugin: 'Plugin', domaine: 'Domaine', hebergement: 'Hébergement' })[t]

  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--color-text-secondary)', marginBottom: 10 }}>
        Renouvellements passés
      </p>

      {entries.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', padding: '8px 0' }}>Aucun renouvellement enregistré.</p>
      )}

      {entries.map((e, i) => {
        const badge = TYPE_BADGE[e.type]
        return (
          <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < entries.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                {e.notes ?? typeLabel(e.type)}
              </span>
              <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginLeft: 8 }}>
                {format(new Date(e.date_renouvellement), 'd MMM yyyy', { locale: fr })}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: badge.bg, color: badge.color }}>
                {typeLabel(e.type)}
              </span>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                {e.montant ? `${e.montant} €` : '—'}
              </span>
            </div>
          </div>
        )
      })}

      <AddRenouvellement clientId={clientId} onAdded={handleAdded} />
    </div>
  )
}
