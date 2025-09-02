import { NextRequest, NextResponse } from 'next/server'
import { proxyBackend } from '@/lib/proxy'

export const runtime = 'nodejs'
const COOKIE = process.env.JWT_COOKIE_NAME || 'pa_token'

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const upstream = await proxyBackend('/v1/patients', {
    method: 'POST',
    headers,
    body: await req.arrayBuffer(),
    timeoutMs: 15000,
  })
  const text = await upstream.text()
  return new NextResponse(text, { status: upstream.status, headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' } })
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const ident = url.searchParams.get('id') // ?id=<uuid-or-external_id>
  if (!ident) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const token = req.cookies.get(COOKIE)?.value
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const upstream = await proxyBackend(`/v1/patients/${encodeURIComponent(ident)}`, { method: 'GET', headers, timeoutMs: 15000 })
  const text = await upstream.text()
  return new NextResponse(text, { status: upstream.status, headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' } })
}
