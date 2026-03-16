'use client'

import { useState } from 'react'

interface Config {
  fromEmail:    string
  appUrl:       string
  supabaseUrl:  string
  cronSchedule: string
  alertDays:    number
}

interface ResendStatus {
  ok: boolean
  domainVerified?: boolean
  fromDomain?: string
  domains?: { name: string; status: string }[]
  error?: string
}

type ResultState = { type: 'idle' } | { type: 'loading'; msg: string } | { type: 'ok'; msg: string } | { type: 'err'; msg: string }

export default function SettingsClient({ config }: { config: Config }) {
  const [toEmail, setToEmail]             = useState(config.fromEmail)
  const [alertDays, setAlertDays]         = useState(config.alertDays)
  const [sendHour, setSendHour]           = useState('08:00')
  const [cronEnabled, setCronEnabled]     = useState(true)
  const [emailResult, setEmailResult]     = useState<ResultState>({ type: 'idle' })
  const [cronResult, setCronResult]       = useState<ResultState>({ type: 'idle' })
  const [resendStatus, setResendStatus]   = useState<ResendStatus | null>(null)
  const [checkingResend, setCheckingResend] = useState(false)

  // ── Test email ─────────────────────────────────────────────────────────
  async function handleTestEmail() {
    setEmailResult({ type: 'loading', msg: 'Envoi en cours…' })
    try {
      const res = await fetch('/api/settings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setEmailResult({ type: 'ok', msg: `Email de test envoyé à ${toEmail}. Vérifie ta boîte mail.` })
    } catch (err: any) {
      setEmailResult({ type: 'err', msg: `Erreur : ${err.message}` })
    }
  }

  // ── Déclenchement manuel du cron ───────────────────────────────────────
  async function handleTriggerCron() {
    setCronResult({ type: 'loading', msg: 'Exécution du cron en cours…' })
    try {
      const res = await fetch(`/api/cron/test?secret=${prompt('Entre le CRON_SECRET :') ?? ''}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const r = data.result
      setCronResult({
        type: 'ok',
        msg: `Terminé · ${r.echeances ?? 0} échéances · ${r.sent ?? 0} emails envoyés · ${r.failed ?? 0} erreur(s)`,
      })
    } catch (err: any) {
      setCronResult({ type: 'err', msg: `Erreur : ${err.message}` })
    }
  }

  // ── Vérification Resend ───────────────────────────────────────────────
  async function handleCheckResend() {
    setCheckingResend(true)
    try {
      const res = await fetch('/api/settings/resend-status')
      const data: ResendStatus = await res.json()
      setResendStatus(data)
    } catch {
      setResendStatus({ ok: false, error: 'Impossible de joindre Resend' })
    } finally {
      setCheckingResend(false)
    }
  }

  const cronHour = parseInt(sendHour.split(':')[0])
  const cronExpr = `0 ${cronHour} * * *`

  return (
    <div style={{ maxWidth: 660, margin: '0 auto', padding: '2rem 1rem' }}>

      {/* ── Section : Alertes email ── */}
      <Section title="Alertes email">
        <Field label="Adresse email expéditeur" hint="Doit être vérifiée dans Resend (RESEND_FROM_EMAIL)">
          <input
            type="email"
            value={config.fromEmail}
            readOnly
            style={inputStyle(true)}
          />
        </Field>
        <Field label="Adresse email destinataire" hint="Toutes les alertes vous seront envoyées (usage solo)">
          <input type="email" value={toEmail} onChange={e => setToEmail(e.target.value)} style={inputStyle()} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 13 }}>
          <Field label="Rappel J-" hint="Jours avant l'échéance" noMargin>
            <input type="number" value={alertDays} min={1} max={60} onChange={e => setAlertDays(+e.target.value)} style={inputStyle()} />
          </Field>
          <Field label="Heure d'envoi (UTC)" hint={`Expression cron : ${cronExpr}`} noMargin>
            <input type="time" value={sendHour} onChange={e => setSendHour(e.target.value)} style={inputStyle()} />
          </Field>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={handleTestEmail} style={btnPrimary}>Envoyer un email de test</button>
          <StatusDot status={emailResult.type === 'ok' ? 'ok' : emailResult.type === 'err' ? 'err' : 'idle'} label={emailResult.type === 'ok' ? 'Resend OK' : emailResult.type === 'err' ? 'Erreur' : 'Non testé'} />
        </div>
        <ResultBox state={emailResult} />
      </Section>

      {/* ── Section : Cron ── */}
      <Section title="Cron job — exécution automatique">
        <SettingRow
          label="Alertes J-15 actives"
          sub="Vérifie chaque matin les échéances à venir"
          right={<Toggle checked={cronEnabled} onChange={setCronEnabled} />}
        />
        <SettingRow
          label="Planification"
          sub={<>Chaque jour à {sendHour} UTC · <code style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>{cronExpr}</code></>}
          right={<span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: cronEnabled ? '#EAF3DE' : '#F1EFE8', color: cronEnabled ? '#3B6D11' : '#5F5E5A' }}>{cronEnabled ? 'Actif' : 'Inactif'}</span>}
        />
        <SettingRow
          label="Dernière exécution"
          sub="Consultez les logs Vercel pour le détail"
          right={<StatusDot status="ok" label="Vercel Cron" />}
        />
        <div style={{ paddingTop: 12, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={handleTriggerCron} style={btnSecondary}>Déclencher maintenant</button>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Exécute le cron manuellement (demande le CRON_SECRET).</span>
        </div>
        <ResultBox state={cronResult} />
      </Section>

      {/* ── Section : Intégrations ── */}
      <Section title="Intégrations">
        <IntegrationRow
          color="#EAF3DE" iconColor="#3B6D11"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>}
          label="Google Sheets"
          sub="Utilisé pour l'import initial des données"
          right={<SmallBtn onClick={() => confirm('Révoquer l\'accès Google Sheets ?') && alert('Révoqué')}>Révoquer</SmallBtn>}
        />
        <IntegrationRow
          color="#E6F1FB" iconColor="#185FA5"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
          label="Resend"
          sub={resendStatus
            ? resendStatus.ok
              ? `Clé valide · domaine ${resendStatus.domainVerified ? 'vérifié' : 'non vérifié'}`
              : `Erreur : ${resendStatus.error}`
            : 'Clé API configurée — cliquer pour vérifier'}
          right={
            <SmallBtn onClick={handleCheckResend} disabled={checkingResend}>
              {checkingResend ? '…' : 'Vérifier'}
            </SmallBtn>
          }
        />
        <IntegrationRow
          color="#F1EFE8" iconColor="#5F5E5A"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>}
          label="Supabase"
          sub={config.supabaseUrl ? `Connecté · ${new URL(config.supabaseUrl).hostname}` : 'Non configuré'}
          right={<StatusDot status={config.supabaseUrl ? 'ok' : 'err'} label={config.supabaseUrl ? 'Connecté' : 'Absent'} />}
        />
      </Section>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button style={btnPrimary}>Enregistrer les paramètres</button>
      </div>

    </div>
  )
}

// ─── Styles constants ──────────────────────────────────────────────────────
const btnPrimary: React.CSSProperties = { padding: '8px 18px', borderRadius: 8, border: 'none', background: '#185FA5', color: '#fff', fontSize: 13, cursor: 'pointer' }
const btnSecondary: React.CSSProperties = { padding: '8px 18px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 13, cursor: 'pointer' }
function inputStyle(readOnly = false): React.CSSProperties {
  return { width: '100%', padding: '8px 11px', border: '0.5px solid var(--color-border-secondary)', borderRadius: 8, fontSize: 13, color: 'var(--color-text-primary)', background: readOnly ? 'var(--color-background-secondary)' : 'var(--color-background-primary)', opacity: readOnly ? 0.7 : 1 }
}

// ─── Sous-composants ────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '1.25rem', marginBottom: 12 }}>
      <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--color-text-secondary)', marginBottom: 14, paddingBottom: 9, borderBottom: '0.5px solid var(--color-border-tertiary)' }}>{title}</p>
      {children}
    </div>
  )
}

function Field({ label, hint, children, noMargin }: { label: string; hint?: string; children: React.ReactNode; noMargin?: boolean }) {
  return (
    <div style={{ marginBottom: noMargin ? 0 : 13 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 5 }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>{hint}</p>}
    </div>
  )
}

function SettingRow({ label, sub, right }: { label: string; sub: React.ReactNode; right: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
      <div>
        <p style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{label}</p>
        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{sub}</p>
      </div>
      {right}
    </div>
  )
}

function IntegrationRow({ color, iconColor, icon, label, sub, right }: { color: string; iconColor: string; icon: React.ReactNode; label: string; sub: string; right: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: color, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
        <div>
          <p style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{label}</p>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{sub}</p>
        </div>
      </div>
      {right}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!checked)} style={{ position: 'relative', width: 34, height: 20, borderRadius: 20, background: checked ? '#185FA5' : 'var(--color-border-secondary)', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: checked ? 17 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
    </div>
  )
}

function StatusDot({ status, label }: { status: 'ok' | 'err' | 'idle'; label: string }) {
  const color = status === 'ok' ? '#639922' : status === 'err' ? '#E24B4A' : '#888780'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{label}</span>
    </div>
  )
}

function SmallBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding: '5px 12px', borderRadius: 7, border: '0.5px solid var(--color-border-secondary)', fontSize: 12, cursor: 'pointer', background: 'var(--color-background-primary)', color: 'var(--color-text-secondary)', opacity: disabled ? 0.5 : 1 }}>
      {children}
    </button>
  )
}

function ResultBox({ state }: { state: ResultState }) {
  if (state.type === 'idle') return null
  const styles: Record<string, React.CSSProperties> = {
    loading: { background: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)' },
    ok:      { background: '#EAF3DE', color: '#3B6D11' },
    err:     { background: '#FCEBEB', color: '#A32D2D' },
  }
  return (
    <div style={{ marginTop: 10, padding: '9px 13px', borderRadius: 8, fontSize: 12, fontFamily: 'var(--font-mono)', ...styles[state.type] }}>
      {state.msg}
    </div>
  )
}
