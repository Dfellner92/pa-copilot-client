import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const url = new URL(req.url)
  const cookie = process.env.JWT_COOKIE_NAME || 'pa_token'

  const res = NextResponse.redirect(new URL('/login', url.origin))
  res.cookies.set(cookie, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return res
}