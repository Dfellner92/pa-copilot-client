import { NextResponse } from 'next/server'

export async function POST() {
  const cookie = process.env.JWT_COOKIE_NAME || 'pa_token'
  const res = NextResponse.json({ ok: true })
  res.cookies.set(cookie, '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0 })
  return res
}