// GET /api/clients/[id]/pdf
// Génère et retourne le PDF de la fiche client
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { getClientById } from '@/lib/supabase/client'
import ClientPDF from '@/components/clients/ClientPDF'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs' // react-pdf nécessite Node.js (pas Edge)

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Récupérer le client avec toutes ses relations
  const client = await getClientById(params.id).catch(() => null)
  if (!client) {
    return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
  }

  try {
    // Générer le PDF en mémoire
    const buffer = await renderToBuffer(
      createElement(ClientPDF, { client })
    )

    // Nom de fichier propre basé sur le nom du projet
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
