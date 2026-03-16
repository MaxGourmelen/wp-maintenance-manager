// src/app/api/import/execute/route.ts
// POST /api/import/execute  { previews: ImportPreview[] }
import { NextRequest, NextResponse } from 'next/server'
import { importClientBatch } from '@/lib/supabase/client'
import type { ImportPreview } from '@/types'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { previews } = body as { previews: ImportPreview[] }

  if (!previews?.length) {
    return NextResponse.json({ error: 'Aucune donnée à importer' }, { status: 400 })
  }

  // Filtrer : on n'importe que les lignes sans erreur et non-doublons
  const validItems = previews
    .filter(p => p.errors.length === 0 && !p.isDuplicate)
    .map(p => ({
      client: p.parsed.client,
      site:   p.parsed.site,
      plugins: p.parsed.plugins,
    }))

  if (validItems.length === 0) {
    return NextResponse.json({ error: 'Aucune ligne valide à importer' }, { status: 400 })
  }

  const results = await importClientBatch(validItems)

  return NextResponse.json({
    imported: results.success,
    skipped:  previews.length - validItems.length,
    errors:   results.errors,
  })
}
