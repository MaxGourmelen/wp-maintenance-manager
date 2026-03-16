// src/app/api/import/preview/route.ts
// POST /api/import/preview  { spreadsheetId }
import { NextRequest, NextResponse } from 'next/server'
import { fetchSheetData, extractSpreadsheetId } from '@/lib/google-sheets/oauth'
import { mapSheetHeaders, parseAllRows } from '@/lib/google-sheets/parser'

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get('google_access_token')?.value
  if (!accessToken) {
    return NextResponse.json({ error: 'Non authentifié Google' }, { status: 401 })
  }

  const body = await request.json()
  const { url } = body

  const spreadsheetId = extractSpreadsheetId(url)
  if (!spreadsheetId) {
    return NextResponse.json({ error: 'URL Google Sheets invalide' }, { status: 400 })
  }

  try {
    const { headers, rows } = await fetchSheetData(spreadsheetId, accessToken)
    const sheetRows = mapSheetHeaders(headers, rows)
    const previews = parseAllRows(sheetRows)

    const stats = {
      total: previews.length,
      valid: previews.filter(p => p.errors.length === 0 && !p.isDuplicate).length,
      warnings: previews.filter(p => p.errors.length > 0 && !p.isDuplicate).length,
      duplicates: previews.filter(p => p.isDuplicate).length,
    }

    return NextResponse.json({ previews, stats, headers })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
