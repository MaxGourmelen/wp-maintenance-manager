import { notFound } from 'next/navigation'
import { getClientById } from '@/lib/supabase/client'
import ClientForm from '@/components/clients/ClientForm'
import type { ClientFormData } from '@/lib/utils/clientFormSchema'

interface Props { params: { id: string } }

export default async function EditClientPage({ params }: Props) {
  const client = await getClientById(params.id).catch(() => null)
  if (!client) notFound()

  const site = client.sites?.[0]

  // Mapper les données Supabase vers le format du formulaire
  const initialData: Partial<ClientFormData> = {
    nom_projet:                     client.nom_projet,
    contact_mail:                   client.contact_mail,
    contact_tel:                    client.contact_tel ?? '',
    repertoire_wp:                  client.repertoire_wp ?? 'wp-admin',
    nom_domaine:                    site?.nom_domaine ?? '',
    hebergeur:                      site?.hebergeur ?? '',
    nbr_adresses_mail:              site?.nbr_adresses_mail ?? 0,
    cout_mensuel:                   site?.cout_mensuel ?? 0,
    date_renouvellement_prestation: site?.date_renouvellement_prestation ?? '',
    plugins: (site?.plugins ?? []).map(p => ({
      id:                   p.id,
      nom:                  p.nom,
      cout:                 p.cout,
      date_renouvellement:  p.date_renouvellement,
      fournisseur:          p.fournisseur ?? '',
    })),
  }

  return (
    <ClientForm
      mode="edit"
      clientId={params.id}
      initialData={initialData}
    />
  )
}
