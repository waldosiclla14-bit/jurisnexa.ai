import { NextRequest, NextResponse } from 'next/server';
import { signUp, signIn, signOut, getCurrentUser, signInWithGoogle, handleGoogleCallback, DEMO_COOKIE } from '@/lib/auth';
import { authLimiter, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const { allowed, resetAt } = authLimiter.check(request);
  if (!allowed) {
    return rateLimitResponse(resetAt);
  }

  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'signup': {
        const { email, password, fullName, tipoUsuario } = body;
        if (!email || !password) {
          return Response.json({ error: 'Email y contraseña son requeridos' }, { status: 400 });
        }
        const data = await signUp(email, password, fullName, tipoUsuario);
        return Response.json({ user: data.user, session: data.session });
      }

      case 'signin': {
        const { email, password } = body;
        if (!email || !password) {
          return Response.json({ error: 'Email y contraseña son requeridos' }, { status: 400 });
        }
        const data = await signIn(email, password);
        return Response.json({ user: data.user, session: data.session });
      }

      case 'google_login': {
        const { redirectTo } = body;
        const origin = request.headers.get('origin') || request.nextUrl.origin;
        const data = await signInWithGoogle(redirectTo || `${origin}/auth/callback`);
        return Response.json({ url: data.url });
      }

      case 'google_callback': {
        const { code, redirectTo } = body;
        if (!code) {
          return Response.json({ error: 'Código de autorización requerido' }, { status: 400 });
        }
        const data = await handleGoogleCallback(code, redirectTo);
        const response = NextResponse.json({ user: data.user, session: data.session });
        response.cookies.set(DEMO_COOKIE, encodeURIComponent(data.user.email), {
          path: '/',
          maxAge: 86400,
          sameSite: 'lax',
        });
        return response;
      }

      case 'signout': {
        await signOut();
        const response = Response.json({ success: true });
        response.headers.set('Set-Cookie', `${DEMO_COOKIE}=; Path=/; Max-Age=0`);
        return response;
      }

      case 'session': {
        const cookieHeader = request.headers.get('cookie');
        const user = await getCurrentUser(cookieHeader);
        return Response.json({ user });
      }

      default:
        return Response.json({ error: 'Acción no válida' }, { status: 400 });
    }
  } catch (error) {
    console.error('Auth error:', error);
    const message = error instanceof Error ? error.message : 'Error de autenticación';
    return Response.json({ error: message }, { status: 500 });
  }
}
