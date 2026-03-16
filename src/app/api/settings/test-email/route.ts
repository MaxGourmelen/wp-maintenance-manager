// POST /api/settings/test-email
// Envoie un email de test pour vérifier que Resend est bien configuré
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  const { toEmail } = await request.json()

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY non configurée' }, { status: 500 })
  }
  if (!process.env.RESEND_FROM_EMAIL) {
    return NextResponse.json({ error: 'RESEND_FROM_EMAIL non configurée' }, { status: 500 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to:   toEmail || process.env.RESEND_FROM_EMAIL,
      subject: 'Test — WP Maintenance Manager',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:32px auto;padding:24px;background:#fff;border-radius:12px;border:1px solid #eee">
          <h2 style="font-size:18px;font-weight:500;margin:0 0 12px">Connexion Resend vérifiée</h2>
          <p style="font-size:14px;color:#666;line-height:1.6">
            Ton instance WP Maintenance Manager est correctement configurée pour envoyer des emails via Resend.
          </p>
          <p style="font-size:12px;color:#999;margin-top:20px">Envoyé depuis ${process.env.NEXT_PUBLIC_APP_URL}</p>
        </div>`,
    })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
