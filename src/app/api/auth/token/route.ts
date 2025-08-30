import { NextResponse } from 'next/server'
import { proxyBackend } from '@/lib/proxy'

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const res = await proxyBackend('/v1/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const data = await res.json();
  const token = data.access_token as string;
  const cookie = process.env.JWT_COOKIE_NAME || 'pa_token';

  const response = NextResponse.json({ ok: true });
  const isProd = process.env.NODE_ENV === 'production';
  response.cookies.set(cookie, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60,
  });
  return response;
}