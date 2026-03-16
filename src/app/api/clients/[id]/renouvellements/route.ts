// POST /api/clients/[id]/renouvellements
// Ajoute une entrée manuelle dans historique_renouvellements pour un site donné
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { z } from 'zod'

const schema = z.object({
  date_renouvellement: z.string().min(1, 'Date requise'),
  type: z.enum(['prestation', 'plugin', 'domaine', 'hebergement']),
  montant: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides', issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  // Récupérer le site_id associé au client
  const { data: site, error: siteErr } = await supabase
    .from('sites')
    .select('id')
    .eq('client_id', params.id)
    .single()

  if (siteErr || !site) {
    return NextResponse.json({ error: 'Site introuvable pour ce client' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('historique_renouvellements')
    .insert({
      site_id:             site.id,
      date_renouvellement: parsed.data.date_renouvellement,
      type:                parsed.data.type,
      montant:             parsed.data.montant,
      notes:               parsed.data.notes ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Si c'est une prestation, on met aussi à jour la date de renouvellement du site
  if (parsed.data.type === 'prestation') {
    await supabase
      .from('sites')
      .update({ date_renouvellement_prestation: parsed.data.date_renouvellement })
      .eq('id', site.id)
  }

  return NextResponse.json(data, { status: 201 })
}

// GET /api/clients/[id]/renouvellements — liste l'historique du client
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data: site } = await supabase
    .from('sites')
    .select('id')
    .eq('client_id', params.id)
    .single()

  if (!site) return NextResponse.json({ error: 'Site introuvable' }, { status: 404 })

  const { data, error } = await supabase
    .from('historique_renouvellements')
    .select('*')
    .eq('site_id', site.id)
    .order('date_renouvellement', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
