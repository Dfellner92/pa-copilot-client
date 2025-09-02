'use client'

import { useMemo, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function RequestDetailClient({ data }: { data: Detail }) {
  const router = useRouter()
  const { success } = useToast()

  // Optional: fetch “requirements snapshot” on the client (safe; independent)
  const [reqs, setReqs] = useState<RequirementsOut | null>(null)
  const primaryCode = useMemo(() => data.codes?.[0] ?? '', [data.codes])
  const reqsAbort = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => {
      mountedRef.current = false
      reqsAbort.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (!primaryCode) { setReqs(null); return }
    reqsAbort.current?.abort()
    reqsAbort.current = new AbortController()
    const signal = reqsAbort.current.signal

    ;(async () => {
      try {
        const r = await fetch(`/api/requirements?code=${encodeURIComponent(primaryCode)}`, {
          cache: 'no-store',
          signal,
        })
        if (r.ok) {
          const json: RequirementsOut = await r.json()
          if (mountedRef.current) setReqs(json)
        }
      } catch {
        /* ignore snapshot errors */
      }
    })()
  }, [primaryCode])

  const copyId = async () => {
    try { await navigator.clipboard.writeText(data.id); success('Request ID copied') } catch {}
  }

  const codes = Array.isArray(data.codes) ? data.codes : (data.codes ? [String(data.codes as any)] : [])
  const diagnoses = Array.isArray(data.diagnosisCodes)
  ? data.diagnosisCodes
  : (data.diagnosisCodes ? [String(data.diagnosisCodes as any)] : [])

  return (
    <>
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
          <div><span className="text-gray-500">Codes:</span> {codes.length ? codes.join(', ') : '—'}</div>
          <div><span className="text-gray-500">Diagnoses:</span> {diagnoses.length ? diagnoses.join(', ') : '—'}</div>
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
    </>
  )
}
