import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getClients() {
  const { data, error } = await supabase
    .from('clients')
    .select(`*, sites(*, plugins(*))`)
    .order('nom_projet')
  if (error) throw error
  return data
}

export async function getClientById(id: string) {
  const { data, error } = await supabase
    .from('clients')
    .select(`*, sites(*, plugins(*), historique_renouvellements(*))`)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getEcheancesAVenir() {
  const { data, error } = await supabase
    .from('echeances_a_venir')
    .select('*')
  if (error) throw error
  return data
}

export async function getDashboardStats() {
  const [{ count: total }, { data: sites }] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('sites').select('cout_mensuel'),
  ])

  const mrr = sites?.reduce((sum, s) => sum + (s.cout_mensuel || 0), 0) ?? 0

  const { data: echeances } = await supabase
    .from('echeances_a_venir')
    .select('*')

  return {
    total_clients: total ?? 0,
    mrr,
    echeances_15j: echeances?.length ?? 0,
    cout_licences_annuel: 0,
  }
}

export async function importClientBatch(
  items: Array<{
    client: any
    site: any
    plugins: any[]
  }>
) {
  const results = { success: 0, errors: [] as string[] }

  for (const item of items) {
    try {
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert(item.client)
        .select()
        .single()
      if (clientError) throw clientError

      const { data: site, error: siteError } = await supabase
        .from('sites')
        .insert({ ...item.site, client_id: client.id })
        .select()
        .single()
      if (siteError) throw siteError

      if (item.plugins.length > 0) {
        const { error: pluginsError } = await supabase
          .from('plugins')
          .insert(item.plugins.map(p => ({ ...p, site_id: site.id })))
        if (pluginsError) throw pluginsError
      }

      results.success++
    } catch (err: any) {
      results.errors.push(`${item.client.nom_projet}: ${err.message}`)
    }
  }

  return results
}
