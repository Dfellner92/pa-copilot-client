import { NextRequest, NextResponse } from 'next/server'
import { proxyBackend } from '@/lib/proxy'

const COOKIE = process.env.JWT_COOKIE_NAME || 'pa_token'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })

  // NEW: read JWT from cookie and forward as Bearer
  const token = req.cookies.get(COOKIE)?.value
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await proxyBackend(`/v1/requirements?code=${encodeURIComponent(code)}`, { headers })
  const json = await res.json()
  return NextResponse.json(json, { status: res.status })
}
