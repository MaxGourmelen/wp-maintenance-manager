// src/app/api/auth/google/route.ts
// GET /api/auth/google → redirige vers Google OAuth
import { NextResponse } from 'next/server'
import { getGoogleAuthUrl } from '@/lib/google-sheets/oauth'

export async function GET() {
  const url = getGoogleAuthUrl()
  return NextResponse.redirect(url)
}
