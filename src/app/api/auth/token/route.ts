import { NextResponse } from 'next/server'
import { proxyBackend } from '@/lib/proxy'

export async function POST(req: Request) {
  // Expect form fields: username, password (OAuth2PasswordRequestForm)
  const form = await req.formData()
  const body = new URLSearchParams()
  body.set('username', String(form.get('username') || ''))
  body.set('password', String(form.get('password') || ''))

  const res = await proxyBackend('/v1/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  const data = await res.json()

  const token = data.access_token as string
  const cookie = process.env.JWT_COOKIE_NAME || 'pa_token'
  const response = NextResponse.json({ ok: true })
  response.cookies.set(cookie, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60, // 1 hour
  })
  return response
}