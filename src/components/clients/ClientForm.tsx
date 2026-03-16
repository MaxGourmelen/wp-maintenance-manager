'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clientFormSchema, defaultClientForm, type ClientFormData } from '@/lib/utils/clientFormSchema'

const HEBERGEURS = [
  'O2switch — compte personnel',
  'O2switch — compte client',
  'OVH',
  'Infomaniak',
  'Cloudways',
  'Kinsta',
  'Autre',
]

interface Props {
  mode: 'new' | 'edit'
  clientId?: string
  initialData?: Partial<ClientFormData>
}

// ─── Composant principal ───────────────────────────────────────────────────
export default function ClientForm({ mode, clientId, initialData }: Props) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: { ...defaultClientForm, ...initialData },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'plugins' })

  async function onSubmit(data: ClientFormData, redirect = false) {
    setSaving(true)
    setServerError(null)

    const url    = mode === 'new' ? '/api/clients' : `/api/clients/${clientId}`
    const method = mode === 'new' ? 'POST'         : 'PATCH'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur serveur')

      const id = mode === 'new' ? json.id : clientId
      if (redirect) router.push(`/clients/${id}`)
      else router.push('/clients')
    } catch (err: any) {
      setServerError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const s = (field: string) => ({
    width: '100%',
    padding: '8px 11px',
    border: `0.5px solid ${(errors as any)[field] ? '#E24B4A' : 'var(--color-border-secondary)'}`,
    borderRadius: 8,
    fontSize: 13,
    color: 'var(--color-text-primary)',
    background: 'var(--color-background-primary)',
  })

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '2rem 1rem' }}>

      {/* Breadcrumb */}
      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
        <a href="/clients" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Clients</a>
        {' › '}
        <span style={{ color: 'var(--color-text-primary)' }}>
          {mode === 'new' ? 'Nouveau client' : `Modifier — ${initialData?.nom_projet ?? ''}`}
        </span>
      </p>

      {/* Erreur serveur */}
      {serverError && (
        <div style={{ background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#A32D2D' }}>
          {serverError}
        </div>
      )}

      <form onSubmit={e => e.preventDefault()}>

        {/* ── Section client ── */}
        <Section title="Informations client">
          <Field label="Nom du projet" required error={errors.nom_projet?.message}>
            <input {...register('nom_projet')} placeholder="ex : Boulangerie Martin" style={s('nom_projet')} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Email contact" required error={errors.contact_mail?.message}>
              <input {...register('contact_mail')} type="email" placeholder="contact@client.fr" style={s('contact_mail')} />
            </Field>
            <Field label="Téléphone">
              <input {...register('contact_tel')} type="tel" placeholder="06 12 34 56 78" style={s('contact_tel')} />
            </Field>
          </div>
        </Section>

        {/* ── Section site ── */}
        <Section title="Site WordPress">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Nom de domaine" required error={errors.nom_domaine?.message}>
              <input {...register('nom_domaine')} placeholder="exemple.fr" style={s('nom_domaine')} />
            </Field>
            <Field label="Répertoire WP">
              <input {...register('repertoire_wp')} placeholder="wp-admin" style={s('repertoire_wp')} />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Hébergeur">
              <Controller control={control} name="hebergeur" render={({ field }) => (
                <select {...field} style={{ ...s('hebergeur'), cursor: 'pointer' }}>
                  <option value="">Choisir…</option>
                  {HEBERGEURS.map(h => <option key={h}>{h}</option>)}
                </select>
              )} />
            </Field>
            <Field label="Adresses mail hébergées">
              <input {...register('nbr_adresses_mail')} type="number" min="0" placeholder="0" style={s('nbr_adresses_mail')} />
            </Field>
          </div>
        </Section>

        {/* ── Section prestation ── */}
        <Section title="Prestation maintenance">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Coût mensuel (€)" required error={errors.cout_mensuel?.message}>
              <input {...register('cout_mensuel')} type="number" min="0" placeholder="0" style={s('cout_mensuel')} />
            </Field>
            <Field label="Date de renouvellement">
              <input {...register('date_renouvellement_prestation')} type="date" style={s('date_renouvellement_prestation')} />
            </Field>
          </div>
        </Section>

        {/* ── Section plugins ── */}
        <Section title="Plugins & licences">
          {fields.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 130px 28px', gap: 8, marginBottom: 6 }}>
              {['Nom du plugin', 'Prix (€/an)', 'Expiration', ''].map(h => (
                <span key={h} style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{h}</span>
              ))}
            </div>
          )}

          {fields.map((field, i) => (
            <div key={field.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 130px 28px', gap: 8, marginBottom: 8, alignItems: 'end' }}>
              <input {...register(`plugins.${i}.nom`)} placeholder="Elementor Pro" style={{ padding: '8px 11px', border: '0.5px solid var(--color-border-secondary)', borderRadius: 8, fontSize: 13, color: 'var(--color-text-primary)', background: 'var(--color-background-primary)', width: '100%' }} />
              <input {...register(`plugins.${i}.cout`)} type="number" min="0" placeholder="49" style={{ padding: '8px 11px', border: '0.5px solid var(--color-border-secondary)', borderRadius: 8, fontSize: 13, color: 'var(--color-text-primary)', background: 'var(--color-background-primary)', width: '100%' }} />
              <input {...register(`plugins.${i}.date_renouvellement`)} type="date" style={{ padding: '8px 11px', border: '0.5px solid var(--color-border-secondary)', borderRadius: 8, fontSize: 13, color: 'var(--color-text-primary)', background: 'var(--color-background-primary)', width: '100%' }} />
              <button type="button" onClick={() => remove(i)} style={{ width: 28, height: 36, borderRadius: 6, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', cursor: 'pointer', fontSize: 13, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => append({ nom: '', cout: 0, date_renouvellement: '' })}
            style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '8px 14px', borderRadius: 8, border: '0.5px dashed var(--color-border-secondary)', background: 'transparent', fontSize: 12, color: 'var(--color-text-secondary)', cursor: 'pointer', justifyContent: 'center', marginTop: 4 }}
          >
            <span style={{ fontSize: 16 }}>+</span> Ajouter un plugin
          </button>
        </Section>

        {/* ── Footer ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTop: '0.5px solid var(--color-border-tertiary)' }}>
          <button type="button" onClick={() => router.push('/clients')}
            style={{ padding: '8px 18px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', fontSize: 13, cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
            Annuler
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" disabled={saving} onClick={handleSubmit(d => onSubmit(d, false))}
              style={{ padding: '8px 18px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', fontSize: 13, cursor: 'pointer', color: 'var(--color-text-primary)', opacity: saving ? 0.5 : 1 }}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button type="button" disabled={saving} onClick={handleSubmit(d => onSubmit(d, true))}
              style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#185FA5', color: '#fff', fontSize: 13, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
              {saving ? 'Enregistrement…' : 'Enregistrer & voir la fiche'}
            </button>
          </div>
        </div>

      </form>
    </div>
  )
}

// ─── Helpers UI ────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '1.25rem', marginBottom: 12 }}>
      <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--color-text-secondary)', marginBottom: 12, paddingBottom: 8, borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
        {title}
      </p>
      {children}
    </div>
  )
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 5 }}>
        {label}{required && <span style={{ color: '#E24B4A', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {error && <p style={{ fontSize: 11, color: '#A32D2D', marginTop: 4 }}>{error}</p>}
    </div>
  )
}
