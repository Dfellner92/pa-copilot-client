// app/api/prior-auth/requests/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { proxyBackend } from '@/lib/proxy'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const COOKIE = process.env.JWT_COOKIE_NAME || 'pa_token'
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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

function splitName(full?: string) {
  if (!full) return {} as { first?: string; last?: string }
  const parts = full.trim().split(/\s+/)
  if (parts.length === 1) return { first: parts[0] }
  return { first: parts[0], last: parts.slice(1).join(' ') }
}

/* ----------------------------- GET (list) ----------------------------- */

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

    const upstream = await proxyBackend(`/v1/prior-auth/requests?${qp}`, {
      method: 'GET',
      headers: authHeaders(req, false),
      timeoutMs: 15000,
    })
    const text = await upstream.text()
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'application/json',
      },
    })
  } catch (err: any) {
    console.error('[pa-list] proxy failed:', err)
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 })
  }
}

/* ---------------------------- POST (create) ---------------------------- */

export async function POST(req: NextRequest) {
  try {
    const incoming = await readJson(req)

    // Normalize incoming names/aliases from the wizard
    const rawPatient = String(
      incoming.patient_id ?? incoming.memberId ?? incoming.member_id ?? ''
    ).trim()
    const coverage = String(
      incoming.coverage_id ?? incoming.coverageId ?? ''
    ).trim()
    const code = String(incoming.code ?? incoming.primaryCode ?? '').trim()

    // diagnoses: array or CSV
    let dx: string[] = []
    if (Array.isArray(incoming.diagnosis_codes)) dx = incoming.diagnosis_codes
    else if (Array.isArray(incoming.diagnosisCodes)) dx = incoming.diagnosisCodes
    else if (typeof incoming.diagnosis_codes === 'string')
      dx = incoming.diagnosis_codes.split(',').map((s: string) => s.trim()).filter(Boolean)
    else if (typeof incoming.diagnosisCodes === 'string')
      dx = incoming.diagnosisCodes.split(',').map((s: string) => s.trim()).filter(Boolean)

    if (!rawPatient || !coverage || !code) {
      return NextResponse.json(
        { error: 'patient_id, coverage_id and code are required' },
        { status: 400 }
      )
    }

    // Optional member fields (for patient ensure)
    let first: string | undefined =
      incoming.first_name ?? incoming.firstName ?? undefined
    let last: string | undefined =
      incoming.last_name ?? incoming.lastName ?? undefined
    const full = incoming.member_name ?? incoming.memberName
    if ((!first || !last) && typeof full === 'string' && full.trim()) {
      const parts = splitName(full)
      first ||= parts.first
      last  ||= parts.last
    }
    const dob: string | undefined =
      incoming.birth_date ?? incoming.birthDate ?? incoming.member_dob ?? incoming.memberDob

    // Resolve a concrete Patient UUID if possible (and create if needed)
    const headersJSON = authHeaders(req, true)
    const headersGET  = authHeaders(req, false)

    // Probe by ident (UUID or external_id)
    let probe = await proxyBackend(`/v1/patients/${encodeURIComponent(rawPatient)}`, {
      method: 'GET',
      headers: headersGET,
      timeoutMs: 12000,
    })

    if (probe.status === 404) {
      // if we have enough data, create by external_id; otherwise create a minimal placeholder
      const body = {
        external_id: rawPatient,
        first_name: first || 'Unknown',
        last_name:  last  || 'Member',
        birth_date: dob   || '1900-01-01',
      }
      const createRes = await proxyBackend('/v1/patients', {
        method: 'POST',
        headers: headersJSON,
        body: JSON.stringify(body),
        timeoutMs: 15000,
      })
      if (!(createRes.status === 201 || createRes.status === 409)) {
        const t = await createRes.text()
        return new NextResponse(t || 'Failed to create patient', {
          status: createRes.status,
          headers: { 'content-type': createRes.headers.get('content-type') ?? 'text/plain' },
        })
      }
      // re-probe to get UUID
      probe = await proxyBackend(`/v1/patients/${encodeURIComponent(rawPatient)}`, {
        method: 'GET',
        headers: headersGET,
        timeoutMs: 12000,
      })
    } else if (!probe.ok) {
      const t = await probe.text()
      return new NextResponse(t || 'Failed to read patient', {
        status: probe.status,
        headers: { 'content-type': probe.headers.get('content-type') ?? 'text/plain' },
      })
    }

    const pj = await probe.json().catch(() => ({} as any))
    const patientUuid: string | undefined = pj?.id
    if (!patientUuid || !UUID_RE.test(patientUuid)) {
      return NextResponse.json({ error: 'Could not resolve patient UUID' }, { status: 500 })
    }

    // Whitelist ONLY the fields the backend expects → avoids 422 for extras
    const forward = {
      patient_id: patientUuid,
      coverage_id: coverage,
      code,
      diagnosis_codes: dx,
      // NEW: Include provider fields
      provider_name: incoming.provider_name || null,
      provider_npi: incoming.provider_npi || null,
    }

    const upstream = await proxyBackend('/v1/prior-auth/requests', {
      method: 'POST',
      headers: headersJSON,
      body: JSON.stringify(forward),
      timeoutMs: 15000,
    })
    const text = await upstream.text()
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'application/json',
      },
    })
  } catch (err: any) {
    console.error('[pa-create] proxy failed:', err)
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 })
  }
}
