'use client'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/requests/StatusBadge'
import { useToast } from '@/components/toast/ToastProvider'

type Detail = {
  id: string
  status: string
  updatedAt?: string
  createdAt?: string
  memberName?: string
  memberId?: string
  memberDob?: string
  providerName?: string
  providerNpi?: string
  codes?: string[]
  diagnosisCodes?: string[]
  notes?: string
  attachments?: { id: string; name?: string; url?: string }[]
}

type RequirementsOut = { requiresAuth: boolean; requiredDocs: string[] }

export default function RequestDetailPage() {
  const { error: toastError, success } = useToast()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params.id

  const [data, setData] = useState<Detail | null>(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [reqs, setReqs] = useState<RequirementsOut | null>(null)

  const detailAbort = useRef<AbortController | null>(null)
  const reqsAbort = useRef<AbortController | null>(null)
  const didLoadRef = useRef<string | null>(null)
  const didReqRef = useRef<string | null>(null)

  // Don’t fetch obviously bad slugs (prevents /requests/new hitting this page)
  const isUuid = useMemo(
    () =>
      typeof id === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id),
    [id]
  )

  const mapDetail = (json: any): Detail => ({
    id: String(json.id ?? json.requestId ?? id),
    status: String(json.status ?? 'pending'),
    updatedAt: json.updatedAt ?? json.updated_at ?? json.modifiedAt ?? undefined,
    createdAt: json.createdAt ?? json.created_at ?? undefined,
    memberName: json.memberName ?? json.member?.name ?? '',
    memberId: json.memberId ?? json.member?.id ?? '',
    memberDob: json.memberDob ?? json.member?.dob ?? '',
    providerName: json.providerName ?? json.provider?.name ?? '',
    providerNpi: json.providerNpi ?? json.provider?.npi ?? '',
    codes: json.codes ?? json.procedures ?? (json.code ? [json.code] : []),
    diagnosisCodes: json.diagnosisCodes ?? json.diagnoses ?? [],
    notes: json.notes ?? '',
    attachments: json.attachments ?? [],
  })

  // Fetch detail — run once per id (Strict Mode safe)
  const loadDetail = useCallback(async () => {
    if (!isUuid) { setNotFound(true); setData(null); return }
    if (didLoadRef.current === id) return
    didLoadRef.current = id

    detailAbort.current?.abort()
    detailAbort.current = new AbortController()
    const signal = detailAbort.current.signal

    setLoading(true)
    setNotFound(false)
    try {
      const r = await fetch(`/api/prior-auth/requests/${encodeURIComponent(id)}`, {
        cache: 'no-store',
        signal,
      })
      if (!r.ok) {
        if (r.status === 401) { toastError('Session expired, please log in again'); window.location.href = '/login'; return }
        if (r.status === 404) { if (!signal.aborted) { setNotFound(true); setData(null) } return }
        toastError('Failed to load request'); return
      }
      const json = await r.json()
      if (!signal.aborted) setData(mapDetail(json))
    } catch (e: any) {
      if (e?.name !== 'AbortError') toastError('Network error loading request')
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }, [id, isUuid, toastError])

  // Fetch requirements snapshot — run once per primaryCode
  const loadRequirements = useCallback(async (code: string) => {
    if (!code) { setReqs(null); return }
    if (didReqRef.current === code) return
    didReqRef.current = code

    reqsAbort.current?.abort()
    reqsAbort.current = new AbortController()
    const signal = reqsAbort.current.signal

    try {
      const r = await fetch(`/api/requirements?code=${encodeURIComponent(code)}`, {
        cache: 'no-store',
        signal,
      })
      if (r.ok && !signal.aborted) {
        const json: RequirementsOut = await r.json()
        setReqs(json)
      }
    } catch {
      /* ignore snapshot errors */
    }
  }, [])

  useEffect(() => {
    loadDetail()
    return () => detailAbort.current?.abort()
  }, [loadDetail])

  const primaryCode = useMemo(() => data?.codes?.[0] ?? '', [data])

  useEffect(() => {
    loadRequirements(primaryCode)
    return () => reqsAbort.current?.abort()
  }, [primaryCode, loadRequirements])

  const copyId = async () => {
    try { await navigator.clipboard.writeText(id); success('Request ID copied') } catch {}
  }

  // ----- Render states -----
  if (!isUuid) {
    return (
      <main className="p-6 max-w-3xl mx-auto">
        <div className="rounded-2xl border p-6 text-sm text-gray-500">Invalid request id.</div>
        <Button onClick={() => router.push('/requests')}>Back to list</Button>
      </main>
    )
  }

  if (loading && !data && !notFound) {
    return (
      <main className="p-6 space-y-4 max-w-3xl mx-auto">
        <div className="rounded-2xl border p-6 text-sm text-gray-500">Loading…</div>
      </main>
    )
  }

  if (notFound || !data) {
    return (
      <main className="p-6 space-y-4 max-w-3xl mx-auto">
        <div className="rounded-2xl border p-6 text-sm text-gray-500">Request not found.</div>
        <Button onClick={() => router.push('/requests')}>Back to list</Button>
      </main>
    )
  }

  return (
    <main className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Request {data.id.slice(0, 8)}…</h1>
          <div className="flex gap-3 text-sm text-gray-500">
            {data.createdAt && <span>Created: {new Date(data.createdAt).toLocaleString()}</span>}
            {data.updatedAt && <span>Updated: {new Date(data.updatedAt).toLocaleString()}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={data.status} />
          <Button onClick={copyId}>Copy ID</Button>
          <Button onClick={() => router.push('/requests')}>Back</Button>
        </div>
      </div>

      {/* Procedure / Requirements */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-4">
          <h2 className="font-medium mb-2">Procedure</h2>
          <div className="space-y-1 text-sm">
            <div><span className="text-gray-500">Codes:</span> {data.codes?.length ? data.codes.join(', ') : '—'}</div>
            <div><span className="text-gray-500">Diagnoses:</span> {data.diagnosisCodes?.length ? data.diagnosisCodes.join(', ') : '—'}</div>
            {data.notes ? <div><span className="text-gray-500">Notes:</span> {data.notes}</div> : null}
          </div>
        </div>
        <div className="rounded-2xl border p-4">
          <h2 className="font-medium mb-2">Requirements snapshot</h2>
          {!primaryCode ? (
            <p className="text-sm text-gray-500">No code on record.</p>
          ) : reqs ? (
            <div className="text-sm space-y-2">
              <div>Requires Prior Auth: <strong>{reqs.requiresAuth ? 'Yes' : 'No'}</strong></div>
              <div>
                <div className="text-gray-500">Required Documents</div>
                {reqs.requiredDocs?.length ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {reqs.requiredDocs.map(d => <li key={d}>{d}</li>)}
                  </ul>
                ) : <div className="text-gray-500">None</div>}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Checking…</p>
          )}
        </div>
      </section>

      {/* Member / Provider */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-4">
          <h2 className="font-medium mb-2">Member</h2>
          <div className="text-sm space-y-1">
            <div><span className="text-gray-500">Name:</span> {data.memberName || '—'}</div>
            <div><span className="text-gray-500">Member ID:</span> {data.memberId || '—'}</div>
            <div><span className="text-gray-500">DOB:</span> {data.memberDob || '—'}</div>
          </div>
        </div>
        <div className="rounded-2xl border p-4">
          <h2 className="font-medium mb-2">Provider</h2>
          <div className="text-sm space-y-1">
            <div><span className="text-gray-500">Name:</span> {data.providerName || '—'}</div>
            <div><span className="text-gray-500">NPI:</span> {data.providerNpi || '—'}</div>
          </div>
        </div>
      </section>

      {/* Attachments */}
      <section className="rounded-2xl border p-4">
        <h2 className="font-medium mb-2">Attachments</h2>
        {data.attachments?.length ? (
          <ul className="list-disc pl-5 text-sm space-y-1">
            {data.attachments.map(a => (
              <li key={a.id}>{a.name || a.id}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No attachments uploaded.</p>
        )}
      </section>
    </main>
  )
}
