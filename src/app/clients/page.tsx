import { getClients } from '@/lib/supabase/client'
import ClientsListClient from '@/components/clients/ClientsListClient'

export default async function ClientsPage() {
  const clients = await getClients()
  return <ClientsListClient clients={clients ?? []} />
}
