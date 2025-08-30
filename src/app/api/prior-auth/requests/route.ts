// app/api/prior-auth/requests/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { proxyBackend } from '@/lib/proxy'

const COOKIE = process.env.JWT_COOKIE_NAME || 'pa_token'

export async function POST(req: NextRequest) {
  try {
    const bodyBuf = await req.arrayBuffer()

    const token = req.cookies.get(COOKIE)?.value
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
    if (token) headers.Authorization = `Bearer ${token}`

    const upstream = await proxyBackend('/v1/prior-auth/requests', {
      method: 'POST',
      headers,
      body: bodyBuf,
      timeoutMs: 15000,
    })

    // Always read body as text first (it might not be JSON on errors)
    const text = await upstream.text()

    // Helpful console for dev (shows status + error body)
    console.log('[prior-auth upstream]', upstream.status, text)

    // Propagate exactly on success
    if (upstream.ok) {
      return new NextResponse(text, {
        status: upstream.status,
        headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
      })
    }

    // On error, bubble the backend message through
    return new NextResponse(text || 'Upstream error', {
      status: upstream.status,
      headers: { 'content-type': upstream.headers.get('content-type') ?? 'text/plain' },
    })
  } catch (err: any) {
    console.error('[api] prior-auth proxy failed:', err)
    return NextResponse.json(
      { error: `Proxy error: ${err?.message ?? String(err)}` },
      { status: 500 }
    )
  }
}
