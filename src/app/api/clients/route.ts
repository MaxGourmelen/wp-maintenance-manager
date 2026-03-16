// POST /api/clients  → créer un nouveau client
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { clientFormSchema } from '@/lib/utils/clientFormSchema'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = clientFormSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides', issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const data = parsed.data

  try {
    // 1. Créer le client
    const { data: client, error: clientErr } = await supabase
      .from('clients')
      .insert({
        nom_projet:    data.nom_projet,
        contact_mail:  data.contact_mail,
        contact_tel:   data.contact_tel,
        repertoire_wp: data.repertoire_wp,
      })
      .select()
      .single()
    if (clientErr) throw clientErr

    // 2. Créer le site
    const { data: site, error: siteErr } = await supabase
      .from('sites')
      .insert({
        client_id:                       client.id,
        nom_domaine:                     data.nom_domaine,
        hebergeur:                       data.hebergeur,
        nbr_adresses_mail:               data.nbr_adresses_mail,
        cout_mensuel:                    data.cout_mensuel,
        date_renouvellement_prestation:  data.date_renouvellement_prestation || null,
      })
      .select()
      .single()
    if (siteErr) throw siteErr

    // 3. Créer les plugins
    if (data.plugins.length > 0) {
      const { error: pluginsErr } = await supabase
        .from('plugins')
        .insert(data.plugins.map(p => ({
          site_id:              site.id,
          nom:                  p.nom,
          cout:                 p.cout,
          date_renouvellement:  p.date_renouvellement,
          fournisseur:          p.fournisseur,
        })))
      if (pluginsErr) throw pluginsErr
    }

    return NextResponse.json({ id: client.id }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
