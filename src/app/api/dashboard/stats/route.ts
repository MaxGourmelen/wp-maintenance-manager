// GET /api/dashboard/stats
// Utilisé pour un refresh côté client sans rechargement de page
import { NextResponse } from 'next/server'
import { getDashboardStats, getEcheancesAVenir } from '@/lib/supabase/client'

export async function GET() {
  try {
    const [stats, echeances] = await Promise.all([
      getDashboardStats(),
      getEcheancesAVenir(),
    ])
    return NextResponse.json({ stats, echeances })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
