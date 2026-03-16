// src/app/api/auth/google/callback/route.ts
// GET /api/auth/google/callback?code=...
import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/google-sheets/oauth'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(new URL('/import?error=no_code', request.url))
  }

  try {
    const tokens = await exchangeCodeForTokens(code)
    // Stocker le token en cookie sécurisé (httpOnly)
    const response = NextResponse.redirect(new URL('/import?step=1', request.url))
    response.cookies.set('google_access_token', tokens.access_token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600, // 1h
      path: '/',
    })
    return response
  } catch {
    return NextResponse.redirect(new URL('/import?error=auth_failed', request.url))
  }
}
