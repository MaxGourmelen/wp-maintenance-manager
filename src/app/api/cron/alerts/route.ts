// GET /api/cron/alerts
// Appelé chaque matin à 8h par Vercel Cron (voir vercel.json)
// Protégé par CRON_SECRET pour éviter les appels non autorisés
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { sendAllAlerts } from '@/lib/email/alertEmail'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {

  // ── Sécurité : vérifier le secret Vercel Cron ────────────────────────────
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // ── 1. Récupérer toutes les échéances J-15 via la vue Supabase ──────────
    const { data: echeances, error } = await supabase
      .from('echeances_a_venir')
      .select('*')
      .order('jours_restants', { ascending: true })

    if (error) throw error
    if (!echeances || echeances.length === 0) {
      return NextResponse.json({ message: 'Aucune échéance à signaler', sent: 0 })
    }

    // ── 2. Grouper par client (nom_projet) ──────────────────────────────────
    const grouped = new Map<string, {
      nom_projet: string
      nom_domaine: string
      items: typeof echeances
    }>()

    for (const e of echeances) {
      if (!grouped.has(e.nom_projet)) {
        grouped.set(e.nom_projet, {
          nom_projet: e.nom_projet,
          nom_domaine: e.nom_domaine,
          items: [],
        })
      }
      grouped.get(e.nom_projet)!.items.push(e)
    }

    // ── 3. Construire la liste des clients à alerter ─────────────────────────
    const clientAlerts = Array.from(grouped.values()).map(g => ({
      nom_projet: g.nom_projet,
      nom_domaine: g.nom_domaine,
      items: g.items.map(e => ({
        type:           e.type,
        nom_item:       e.nom_item,
        date_echeance:  e.date_echeance,
        jours_restants: e.jours_restants,
        montant:        e.montant,
      })),
    }))

    // ── 4. Envoyer les emails ────────────────────────────────────────────────
    const results = await sendAllAlerts(clientAlerts)

    console.log(`[cron/alerts] ${results.sent} emails envoyés, ${results.failed} erreurs`)
    if (results.errors.length > 0) {
      console.error('[cron/alerts] Erreurs:', results.errors)
    }

    return NextResponse.json({
      date:       new Date().toISOString(),
      echeances:  echeances.length,
      clients:    clientAlerts.length,
      sent:       results.sent,
      failed:     results.failed,
      errors:     results.errors,
    })

  } catch (err: any) {
    console.error('[cron/alerts]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
