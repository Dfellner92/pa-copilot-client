import { NextRequest, NextResponse } from 'next/server'


const PROTECTED = [/^\/dashboard/]


// Optional: small helper to decode JWT payload (no signature verification)
function readJwtExp(token: string | undefined): number | null {
if (!token) return null
try {
const payload = JSON.parse(atob(token.split('.')[1] || ''))
return typeof payload?.exp === 'number' ? payload.exp : null
} catch {
return null
}
}


export function middleware(req: NextRequest) {
const cookie = process.env.JWT_COOKIE_NAME || 'pa_token'
const token = req.cookies.get(cookie)?.value
const isProtected = PROTECTED.some((r) => r.test(req.nextUrl.pathname))


if (!isProtected) return NextResponse.next()


// Hardened check: require non‑expired JWT
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