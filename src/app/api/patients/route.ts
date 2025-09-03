import { NextRequest, NextResponse } from 'next/server'
import { proxyBackend } from '@/lib/proxy'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const COOKIE = process.env.JWT_COOKIE_NAME || 'pa_token'

function authHeaders(req: NextRequest, json: boolean) {
  const token = req.cookies.get(COOKIE)?.value
  const h: Record<string, string> = json
    ? { accept: 'application/json', 'content-type': 'application/json' }
    : { accept: 'application/json' }
  if (token) h.authorization = `Bearer ${token}`
  return h
}

async function readJson(req: NextRequest): Promise<any> {
  try { return await req.json() } catch {}
  const t = await req.text().catch(() => '')
  try { return JSON.parse(t) } catch { return {} }
}

export async function POST(req: NextRequest) {
  try {
    console.log('[DEBUG] Patient creation API route called')
    
    const incoming = await readJson(req)
    console.log('[DEBUG] Incoming data:', JSON.stringify(incoming, null, 2))
    
    const { external_id, first_name, last_name, birth_date } = incoming
    
    if (!external_id || !first_name || !last_name || !birth_date) {
      console.log('[DEBUG] Missing required fields:', { external_id, first_name, last_name, birth_date })
      return NextResponse.json(
        { error: 'external_id, first_name, last_name, and birth_date are required' },
        { status: 400 }
      )
    }

    const headersJSON = authHeaders(req, true)
    console.log('[DEBUG] Headers:', headersJSON)
    
    console.log('[DEBUG] Calling proxyBackend to /v1/patients')
    const upstream = await proxyBackend('/v1/patients', {
      method: 'POST',
      headers: headersJSON,
      body: JSON.stringify({
        external_id,
        first_name,
        last_name,
        birth_date,
      }),
      timeoutMs: 15000,
    })
    
    console.log('[DEBUG] Backend response status:', upstream.status)
    const text = await upstream.text()
    console.log('[DEBUG] Backend response body:', text)
    
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'application/json',
      },
    })
  } catch (err: any) {
    console.error('[patient-create] proxy failed:', err)
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 })
  }
}
