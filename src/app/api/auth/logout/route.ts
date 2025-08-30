// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const url = new URL(req.url)
  const cookieName = process.env.JWT_COOKIE_NAME || 'pa_token'
  const isProd = process.env.NODE_ENV === 'production'

  const res = NextResponse.redirect(new URL('/login', url.origin))
  // Clear cookie
  res.cookies.set({
    name: cookieName,
    value: '',
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,                 // expire immediately
    // expires: new Date(0),   // (optional) belt-and-suspenders
  })
  return res
}
