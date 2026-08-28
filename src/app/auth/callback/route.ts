import { NextRequest, NextResponse } from 'next/server';
import { handleGoogleCallback, DEMO_COOKIE } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { code } = Object.fromEntries(request.nextUrl.searchParams);
  const redirectTo = request.nextUrl.searchParams.get('next') || '/chat';

  if (!code) {
    const url = new URL('/login', request.nextUrl.origin);
    url.searchParams.set('error', 'Autorización cancelada o inválida');
    return NextResponse.redirect(url);
  }

  try {
    const data = await handleGoogleCallback(code, redirectTo);
    const response = NextResponse.redirect(new URL(redirectTo, request.nextUrl.origin));
    response.cookies.set(DEMO_COOKIE, encodeURIComponent(data.user.email), {
      path: '/',
      maxAge: 86400,
      sameSite: 'lax',
      httpOnly: false,
    });
    return response;
  } catch (error) {
    console.error('Google callback error:', error);
    const url = new URL('/login', request.nextUrl.origin);
    url.searchParams.set('error', 'No se pudo completar el inicio de sesión con Google');
    return NextResponse.redirect(url);
  }
}