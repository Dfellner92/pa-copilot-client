import { NextResponse } from 'next/server'


function readJwtExp(token: string | undefined): number | null {
if (!token) return null
try {
const payload = JSON.parse(atob(token.split('.')[1] || ''))
return typeof payload?.exp === 'number' ? payload.exp : null
} catch {
return null
}
}


export async function GET() {
const cookieName = process.env.JWT_COOKIE_NAME || 'pa_token'
// In a Route Handler, use request cookies via headers in Next 14: not needed here, Next provides cookies() too if using server runtime.
// But to avoid importing, let’s read from request headers via standard helper:
const token = (await (await import('next/headers')).cookies()).get(cookieName)?.value
const exp = readJwtExp(token)
const now = Math.floor(Date.now() / 1000)
if (!token || !exp || exp <= now) return NextResponse.json({ ok: false }, { status: 401 })
return NextResponse.json({ ok: true })
}