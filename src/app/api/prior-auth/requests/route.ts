import { NextResponse } from 'next/server'
import { proxyBackend } from '@/lib/proxy'

export async function POST(req: Request) {
  try {
    const body = await req.arrayBuffer() // read once
    const upstream = await proxyBackend('/v1/prior-auth/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body, // forward raw
    })

    // forward upstream body/status/ct exactly (prevents JSON parse errors)
    const buf = await upstream.arrayBuffer()
    const headers = new Headers()
    const ct = upstream.headers.get('content-type')
    if (ct) headers.set('content-type', ct)
    return new NextResponse(buf, { status: upstream.status, headers })
  } catch (err) {
    console.error('[api] create prior-auth failed:', err)
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 })
  }
}
