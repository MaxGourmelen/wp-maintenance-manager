// PATCH /api/clients/[id]  → mettre à jour un client existant
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { clientFormSchema } from '@/lib/utils/clientFormSchema'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    // 1. Mettre à jour le client
    const { error: clientErr } = await supabase
      .from('clients')
      .update({
        nom_projet:    data.nom_projet,
        contact_mail:  data.contact_mail,
        contact_tel:   data.contact_tel,
        repertoire_wp: data.repertoire_wp,
      })
      .eq('id', params.id)
    if (clientErr) throw clientErr

    // 2. Récupérer le site associé
    const { data: site, error: siteGetErr } = await supabase
      .from('sites')
      .select('id')
      .eq('client_id', params.id)
      .single()
    if (siteGetErr) throw siteGetErr

    // 3. Mettre à jour le site
    const { error: siteErr } = await supabase
      .from('sites')
      .update({
        nom_domaine:                     data.nom_domaine,
        hebergeur:                       data.hebergeur,
        nbr_adresses_mail:               data.nbr_adresses_mail,
        cout_mensuel:                    data.cout_mensuel,
        date_renouvellement_prestation:  data.date_renouvellement_prestation || null,
      })
      .eq('id', site.id)
    if (siteErr) throw siteErr

    // 4. Plugins : stratégie replace (supprimer tous + recréer)
    await supabase.from('plugins').delete().eq('site_id', site.id)

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

    return NextResponse.json({ id: params.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/clients/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: true })
}
