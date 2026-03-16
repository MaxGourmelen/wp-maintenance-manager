import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { getClientById } from '@/lib/supabase/client'
import ClientPDF from '@/components/clients/ClientPDF'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await getClientById(params.id).catch(() => null)
  if (!client) {
    return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
  }

  try {
    const element = createElement(ClientPDF, { client }) as any
    const buffer = await renderToBuffer(element)

    const filename = client.nom_projet
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}-fiche.pdf"`,
        'Content-Length': buffer.byteLength.toString(),
        'Cache-Control': 'no-store',
      },
    })
  } catch (err: any) {
    console.error('[pdf] Erreur génération:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
