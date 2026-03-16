// GET /api/cron/test
// Déclencher manuellement le cron en dev ou pour tester en prod
// Accessible uniquement si CRON_SECRET est fourni dans l'URL
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Secret invalide' }, { status: 401 })
  }

  // Appeler la route cron en interne
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const response = await fetch(`${baseUrl}/api/cron/alerts`, {
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
  })
  const data = await response.json()
  return NextResponse.json({ triggered: true, result: data })
}
