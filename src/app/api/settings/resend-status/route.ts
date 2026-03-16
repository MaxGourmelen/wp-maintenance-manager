// GET /api/settings/resend-status
// Vérifie que la clé Resend est valide en appelant l'API Resend
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function GET() {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: false, error: 'Clé API manquante', domains: [] })
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    // Lister les domaines vérifiés comme health check
    const { data, error } = await resend.domains.list()
    if (error) throw error

    const fromDomain = process.env.RESEND_FROM_EMAIL?.split('@')[1] ?? ''
    const verified = data?.data?.find(d => d.name === fromDomain && d.status === 'verified')

    return NextResponse.json({
      ok: true,
      domainVerified: !!verified,
      fromDomain,
      domains: data?.data?.map(d => ({ name: d.name, status: d.status })) ?? [],
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message, domains: [] })
  }
}
