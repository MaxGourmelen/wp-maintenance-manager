import { notFound } from 'next/navigation'
import { getClientById } from '@/lib/supabase/client'
import ClientDetail from '@/components/clients/ClientDetail'

interface Props {
  params: { id: string }
}

export default async function ClientPage({ params }: Props) {
  const client = await getClientById(params.id).catch(() => null)
  if (!client) notFound()

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem' }}>
      <ClientDetail client={client} />
    </main>
  )
}

// Génère les métadonnées dynamiques (onglet du navigateur)
export async function generateMetadata({ params }: Props) {
  const client = await getClientById(params.id).catch(() => null)
  return {
    title: client ? `${client.nom_projet} — WP Maintenance` : 'Client introuvable',
  }
}
