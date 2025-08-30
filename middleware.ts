import { NextRequest, NextResponse } from 'next/server'

const COOKIE = process.env.JWT_COOKIE_NAME || 'pa_token'
const PROTECTED = [/^\/dashboard(?:\/|$)/]

function b64urlDecode(input: string): string {
  const pad = (4 - (input.length % 4)) % 4
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad)
  // atob is available in the edge runtime
  return decodeURIComponent(
    Array.prototype.map
      .call(atob(base64), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  )
}

function readJwtExp(token?: string): number | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const payloadJson = b64urlDecode(parts[1])
    const payload = JSON.parse(payloadJson)
    return typeof payload?.exp === 'number' ? payload.exp : null
  } catch {
    return null
  }
}

export function middleware(req: NextRequest) {
  const isProtected = PROTECTED.some((r) => r.test(req.nextUrl.pathname))
  if (!isProtected) return NextResponse.next()

  const token = req.cookies.get(COOKIE)?.value
  const exp = readJwtExp(token)
  const now = Math.floor(Date.now() / 1000)
  const valid = !!token && !!exp && exp > now

  if (!valid) {
    const url = new URL('/login', req.nextUrl.origin)
    url.searchParams.set('next', req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = { matcher: ['/dashboard/:path*'] }
