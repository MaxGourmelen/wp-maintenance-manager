import { getDashboardStats, getEcheancesAVenir } from '@/lib/supabase/client'
import { getDashboardChartsData } from '@/lib/supabase/charts'
import DashboardClient from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const [stats, echeances, chartsData] = await Promise.all([
    getDashboardStats(),
    getEcheancesAVenir(),
    getDashboardChartsData(),
  ])

  return (
    <DashboardClient
      stats={stats}
      echeances={echeances ?? []}
      chartsData={chartsData}
    />
  )
}
