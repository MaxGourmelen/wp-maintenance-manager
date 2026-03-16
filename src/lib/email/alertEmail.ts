import { Resend } from 'resend'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

const resend = new Resend(process.env.RESEND_API_KEY)

// ─── Types ─────────────────────────────────────────────────────────────────
interface AlertItem {
  type: string
  nom_item: string | null
  date_echeance: string
  jours_restants: number
  montant: number | null
}

interface ClientAlert {
  nom_projet: string
  nom_domaine: string
  contact_mail?: string
  items: AlertItem[]
}

// ─── Formateurs ────────────────────────────────────────────────────────────
function fmtDate(d: string) {
  return format(parseISO(d), 'd MMMM yyyy', { locale: fr })
}
function fmtEuro(n: number | null) {
  if (!n) return ''
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}
function urgencyColor(days: number) {
  if (days <= 7)  return '#A32D2D'
  if (days <= 15) return '#854F0B'
  return '#3B6D11'
}
function urgencyLabel(days: number) {
  if (days < 0)  return 'Expiré'
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Demain'
  return `Dans ${days} jours`
}

// ─── Template HTML ─────────────────────────────────────────────────────────
function buildEmailHtml(client: ClientAlert): string {
  const rows = client.items.map(item => {
    const color = urgencyColor(item.jours_restants)
    const label = urgencyLabel(item.jours_restants)
    const typeLabel = item.type === 'prestation' ? 'Prestation' : 'Plugin'
    const nomItem = item.nom_item ?? 'Maintenance mensuelle'
    return `
      <tr>
        <td style="padding:10px 12px;font-size:13px;color:#2C2C2A;border-bottom:1px solid #F1EFE8">${nomItem}</td>
        <td style="padding:10px 12px;font-size:12px;color:#5F5E5A;border-bottom:1px solid #F1EFE8">${typeLabel}</td>
        <td style="padding:10px 12px;font-size:13px;color:#2C2C2A;border-bottom:1px solid #F1EFE8">${fmtDate(item.date_echeance)}</td>
        <td style="padding:10px 12px;text-align:right;border-bottom:1px solid #F1EFE8">
          <span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:500;background:${color}22;color:${color}">${label}</span>
        </td>
        ${item.montant ? `<td style="padding:10px 12px;font-size:13px;font-weight:500;color:#2C2C2A;text-align:right;border-bottom:1px solid #F1EFE8">${fmtEuro(item.montant)}</td>` : '<td style="border-bottom:1px solid #F1EFE8"></td>'}
      </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F7F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E8E6DF">

    <!-- Header -->
    <div style="padding:24px 32px;border-bottom:1px solid #F1EFE8">
      <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#888780">WP Maintenance</p>
      <h1 style="margin:8px 0 0;font-size:20px;font-weight:500;color:#2C2C2A">Échéances à venir</h1>
    </div>

    <!-- Intro -->
    <div style="padding:20px 32px;border-bottom:1px solid #F1EFE8">
      <p style="margin:0;font-size:14px;color:#5F5E5A;line-height:1.6">
        Le site <strong style="color:#2C2C2A">${client.nom_projet}</strong>
        (<span style="font-family:monospace;font-size:13px">${client.nom_domaine}</span>)
        a <strong style="color:#2C2C2A">${client.items.length} échéance${client.items.length > 1 ? 's' : ''}</strong>
        dans les 15 prochains jours.
      </p>
    </div>

    <!-- Table -->
    <div style="padding:0 32px 24px">
      <table style="width:100%;border-collapse:collapse;margin-top:20px">
        <thead>
          <tr style="background:#F8F7F4">
            <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:500;color:#888780;text-transform:uppercase;letter-spacing:.06em">Élément</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:500;color:#888780;text-transform:uppercase;letter-spacing:.06em">Type</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:500;color:#888780;text-transform:uppercase;letter-spacing:.06em">Date</th>
            <th style="padding:8px 12px;text-align:right;font-size:11px;font-weight:500;color:#888780;text-transform:uppercase;letter-spacing:.06em">Délai</th>
            <th style="padding:8px 12px;text-align:right;font-size:11px;font-weight:500;color:#888780;text-transform:uppercase;letter-spacing:.06em">Montant</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <!-- CTA -->
    <div style="padding:20px 32px 28px;border-top:1px solid #F1EFE8;display:flex;align-items:center;gap:16px">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/clients"
         style="display:inline-block;padding:9px 20px;background:#185FA5;color:#fff;border-radius:8px;font-size:13px;text-decoration:none;font-weight:500">
        Voir tous les clients →
      </a>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;background:#F8F7F4;border-top:1px solid #F1EFE8">
      <p style="margin:0;font-size:11px;color:#888780">
        Envoyé automatiquement par WP Maintenance Manager · 
        <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color:#888780">Accéder au tableau de bord</a>
      </p>
    </div>
  </div>
</body>
</html>`
}

// ─── Envoi d'un email d'alerte ─────────────────────────────────────────────
export async function sendAlertEmail(client: ClientAlert): Promise<{ success: boolean; error?: string }> {
  const urgentCount = client.items.filter(i => i.jours_restants <= 7).length
  const subject = urgentCount > 0
    ? `⚠ ${urgentCount} échéance${urgentCount > 1 ? 's' : ''} urgente${urgentCount > 1 ? 's' : ''} — ${client.nom_projet}`
    : `Rappel : ${client.items.length} échéance${client.items.length > 1 ? 's' : ''} à venir — ${client.nom_projet}`

  try {
    await resend.emails.send({
      from:    process.env.RESEND_FROM_EMAIL!,
      to:      process.env.RESEND_FROM_EMAIL!, // envoi à soi-même (usage solo)
      subject,
      html:    buildEmailHtml(client),
    })
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// ─── Envoi groupé pour tous les clients concernés ─────────────────────────
export async function sendAllAlerts(clients: ClientAlert[]): Promise<{
  sent: number
  failed: number
  errors: string[]
}> {
  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const client of clients) {
    const result = await sendAlertEmail(client)
    if (result.success) sent++
    else {
      failed++
      errors.push(`${client.nom_projet}: ${result.error}`)
    }
    // Pause 200ms entre chaque envoi (rate limit Resend)
    await new Promise(r => setTimeout(r, 200))
  }

  return { sent, failed, errors }
}
