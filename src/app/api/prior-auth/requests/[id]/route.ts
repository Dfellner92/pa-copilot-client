import { NextResponse } from 'next/server'
import { proxyBackend } from '@/lib/proxy'

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params
    const upstream = await proxyBackend(`/v1/prior-auth/requests/${encodeURIComponent(id)}`, {
      // you can add headers here if needed
    })

    // Stream/forward body + status + content-type as-is
    const body = await upstream.arrayBuffer()
    const headers = new Headers()
    const ct = upstream.headers.get('content-type')
    if (ct) headers.set('content-type', ct)
    return new NextResponse(body, { status: upstream.status, headers })
  } catch (err) {
    console.error('[api] prior-auth detail proxy failed:', err)
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 })
  }
}
