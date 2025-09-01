// app/api/prior-auth/requests/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { proxyBackend } from '@/lib/proxy'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const COOKIE = process.env.JWT_COOKIE_NAME || 'pa_token'

// GET /api/prior-auth/requests?status=&limit=&offset=
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const limit  = url.searchParams.get('limit')  ?? '50'
    const offset = url.searchParams.get('offset') ?? '0'

    const qp = new URLSearchParams()
    if (status) qp.set('status', status)
    qp.set('limit',  limit)
    qp.set('offset', offset)

    const token = req.cookies.get(COOKIE)?.value
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`

    const upstream = await proxyBackend(`/v1/prior-auth/requests?${qp.toString()}`, {
      method: 'GET',
      headers,
      // if proxyBackend doesn't force no-store, add:
      // cache: 'no-store',
      timeoutMs: 15000,
    })

    const text = await upstream.text()
    // pass through body verbatim (JSON or error text)
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'application/json',
      },
    })
  } catch (err: any) {
    console.error('[api] prior-auth list proxy failed:', err)
    return NextResponse.json(
      { error: `Proxy error: ${err?.message ?? String(err)}` },
      { status: 500 }
    )
  }
}

// POST /api/prior-auth/requests
export async function POST(req: NextRequest) {
  try {
    const bodyBuf = await req.arrayBuffer()

    const token = req.cookies.get(COOKIE)?.value
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }
    if (token) headers.Authorization = `Bearer ${token}`

    const upstream = await proxyBackend('/v1/prior-auth/requests', {
      method: 'POST',
      headers,
      body: bodyBuf,
      timeoutMs: 15000,
    })

    const text = await upstream.text()
    console.log('[prior-auth upstream]', upstream.status, text)

    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'application/json',
      },
    })
  } catch (err: any) {
    console.error('[api] prior-auth proxy failed:', err)
    return NextResponse.json(
      { error: `Proxy error: ${err?.message ?? String(err)}` },
      { status: 500 }
    )
  }
}
