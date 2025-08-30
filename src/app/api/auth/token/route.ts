// frontend/app/api/auth/token/route.ts
import { NextResponse } from 'next/server';
import { proxyBackend } from '@/lib/proxy';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const body = new URLSearchParams();
    body.set('username', String(form.get('username') ?? ''));
    body.set('password', String(form.get('password') ?? ''));

    const res = await proxyBackend('/v1/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      timeoutMs: 10000,
    });

    if (!res.ok) {
      // Try to pass through API error text
      let msg = 'Invalid credentials';
      try { msg = (await res.json())?.detail ?? msg; } catch {}
      return NextResponse.json({ error: msg }, { status: res.status });
    }

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
  } catch (err: any) {
    // This is where missing API_BASE or network issues end up
    return NextResponse.json(
      { error: `Auth route failed: ${err?.message ?? String(err)}` },
      { status: 500 }
    );
  }
}
