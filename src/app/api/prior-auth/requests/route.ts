// app/api/prior-auth/requests/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { proxyBackend } from '@/lib/proxy'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const COOKIE = process.env.JWT_COOKIE_NAME || 'pa_token'
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/* --------------------------- GET: list requests --------------------------- */

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const limit = url.searchParams.get('limit') ?? '50'
    const offset = url.searchParams.get('offset') ?? '0'

    const qp = new URLSearchParams()
    if (status) qp.set('status', status)
    qp.set('limit', limit)
    qp.set('offset', offset)

    const headers = makeAuthHeaders(req, { json: false })
    const upstream = await proxyBackend(`/v1/prior-auth/requests?${qp.toString()}`, {
      method: 'GET',
      headers,
      timeoutMs: 15000,
    })

    const text = await upstream.text()
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        'content-type':
          upstream.headers.get('content-type') ?? 'application/json',
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

/* --------------------------- POST: create request --------------------------- */

export async function POST(req: NextRequest) {
  try {
    // Parse JSON body (we’ll rebuild what we forward downstream)
    const incoming = await req.json().catch(() => ({} as any))

    // Extract what the PA create actually needs
    const patient_id_raw: string = (incoming.patient_id ?? incoming.memberId ?? '').trim()
    const coverage_id: string = (incoming.coverage_id ?? incoming.coverageId ?? '').trim()
    const code: string = (incoming.code ?? incoming.primaryCode ?? '').trim()
    const diagnosis_codes: string[] =
      Array.isArray(incoming.diagnosis_codes)
        ? incoming.diagnosis_codes
        : Array.isArray(incoming.diagnosisCodes)
        ? incoming.diagnosisCodes
        : typeof incoming.diagnosis_codes === 'string'
        ? incoming.diagnosis_codes.split(',').map((s: string) => s.trim()).filter(Boolean)
        : typeof incoming.diagnosisCodes === 'string'
        ? incoming.diagnosisCodes.split(',').map((s: string) => s.trim()).filter(Boolean)
        : []

    // Extract optional patient fields (several shapes supported)
    const first_name: string | undefined =
      incoming.first_name ??
      incoming.firstName ??
      (typeof incoming.member_name === 'string'
        ? (incoming.member_name as string).split(' ')[0]
        : undefined)
    const last_name: string | undefined =
      incoming.last_name ??
      incoming.lastName ??
      (typeof incoming.member_name === 'string'
        ? (incoming.member_name as string).split(' ').slice(1).join(' ') || undefined
        : undefined)
    const birth_date: string | undefined =
      incoming.birth_date ??
      incoming.birthDate ??
      incoming.member_dob ??
      incoming.memberDob

    // Ensure we have something to use for patient_id
    if (!patient_id_raw) {
      return NextResponse.json(
        { error: 'Missing patient_id' },
        { status: 400 }
      )
    }
    if (!coverage_id) {
      return NextResponse.json(
        { error: 'Missing coverage_id' },
        { status: 400 }
      )
    }
    if (!code) {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 })
    }

    const looksUuid = UUID_RE.test(patient_id_raw)

    // If it is NOT a UUID and we have custom fields, create the Patient first (by external_id)
    if (!looksUuid && first_name && last_name && birth_date) {
      const headers = makeAuthHeaders(req, { json: true })
      const createBody = JSON.stringify({
        external_id: patient_id_raw,
        first_name,
        last_name,
        birth_date,
      })

      const createRes = await proxyBackend('/v1/patients', {
        method: 'POST',
        headers,
        body: createBody,
        timeoutMs: 15000,
      })

      // 201 = created, 409 = already exists (both are fine)
      if (!(createRes.status === 201 || createRes.status === 409)) {
        const text = await createRes.text()
        console.warn('[patients create] failed', createRes.status, text)
        return new NextResponse(
          text || 'Failed to create patient',
          {
            status: createRes.status,
            headers: {
              'content-type':
                createRes.headers.get('content-type') ?? 'text/plain',
            },
          }
        )
      }
    }

    // Forward the PA create with only the fields backend expects
    const forwardPayload = {
      patient_id: patient_id_raw, // UUID or external_id; backend resolves it
      coverage_id,
      code,
      diagnosis_codes,
    }

    const headers = makeAuthHeaders(req, { json: true })
    const upstream = await proxyBackend('/v1/prior-auth/requests', {
      method: 'POST',
      headers,
      body: JSON.stringify(forwardPayload),
      timeoutMs: 15000,
    })

    const text = await upstream.text()
    console.log('[prior-auth upstream]', upstream.status, text)

    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        'content-type':
          upstream.headers.get('content-type') ?? 'application/json',
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

/* --------------------------------- helpers -------------------------------- */

function makeAuthHeaders(
  req: NextRequest,
  opts: { json: boolean }
): Record<string, string> {
  const token = req.cookies.get(COOKIE)?.value
  const h: Record<string, string> = {}
  if (opts.json) {
    h['content-type'] = 'application/json'
    h['accept'] = 'application/json'
  } else {
    h['accept'] = 'application/json'
  }
  if (token) h['authorization'] = `Bearer ${token}`
  return h
}
