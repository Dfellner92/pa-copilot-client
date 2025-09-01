'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
// If you have a toast hook, you can wire it here; not needed for basic UI:
// import { useToast } from '@/components/toast/ToastProvider'

export type Row = {
  id: string
  status: string
  disposition?: string | null
  requiresAuth?: boolean
  requiredDocs?: string[]
  memberName?: string | null
  memberId?: string | null
  providerName?: string | null
  codes?: string[]
  updatedAt?: string | null
}

type RequestStatus = 'pending' | 'submitted' | 'approved' | 'denied' | 'error'

const PAGE_SIZE = 10
const STATUS: RequestStatus[] = ['pending', 'submitted', 'approved', 'denied', 'error']

// Map backend shapes to the Row we render
function normalize(items: any[]): Row[] {
  return (items || []).map((x) => ({
    id: String(x.id ?? x.requestId ?? ''),
    status: String(x.status ?? 'pending').toLowerCase(),
    disposition: x.disposition ?? null,
    requiresAuth: x.requiresAuth,
    requiredDocs: x.requiredDocs ?? [],
    memberName: x.memberName ?? x.member?.name ?? null,
    memberId: x.memberId ?? x.member?.id ?? x.patient_id ?? x.patientId ?? null,
    providerName: x.providerName ?? x.provider?.name ?? null,
    codes: x.codes ?? x.procedures ?? (x.code ? [x.code] : []),
    updatedAt:
      x.updatedAt ??
      x.updated_at ??
      x.modifiedAt ??
      x.createdAt ??
      x.created_at ??
      null,
  }))
}

export default function RequestsTableClient({
  initialItems,
  total,
}: {
  initialItems: any[]
  total: number
}) {
  const router = useRouter()
  // const { error: toastError } = useToast()

  // 1) take what server gave us (already fresh due to no-store)
  const raw = useMemo(() => normalize(initialItems), [initialItems])

  // 2) UI state
  const [activeStatus, setActiveStatus] = useState<RequestStatus | 'all'>('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  // 3) filter + search
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return raw.filter((r) => {
      const okStatus = activeStatus === 'all' ? true : r.status === activeStatus
      if (!okStatus) return false
      if (!q) return true
      const hay = `${r.memberName ?? ''} ${r.memberId ?? ''} ${(r.codes ?? []).join(' ')}`.toLowerCase()
      return hay.includes(q)
    })
  }, [raw, activeStatus, query])

  // 4) pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)
  const start = (pageSafe - 1) * PAGE_SIZE
  const pageItems = filtered.slice(start, start + PAGE_SIZE)

  // reset page when filters change
  // (same behavior you had)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => setPage(1), [activeStatus, query])

  // ----- UI -----
  return (
    <main className="p-6 space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Prior Auth Requests</h1>
        <Button onClick={() => router.push('/requests/new')}>New Request</Button>
      </div>

      {/* Status tabs + search */}
      <div className="flex flex-wrap items-center gap-2">
        <Tab
          label="All"
          active={activeStatus === 'all'}
          onClick={() => setActiveStatus('all')}
        />
        {STATUS.map((s) => (
          <Tab
            key={s}
            label={capitalize(s)}
            active={activeStatus === s}
            onClick={() => setActiveStatus(s)}
          />
        ))}

        <div className="ml-auto flex items-center gap-2">
          <input
            className="h-9 rounded-lg border px-3 text-sm"
            placeholder="Search by member / code / ID"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query ? (
            <Button variant="secondary" onClick={() => setQuery('')}>
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      {/* Table / Empty state */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border p-6 text-sm text-gray-500">
          {raw.length ? 'No matches.' : 'No requests yet.'}
        </div>
      ) : (
        <div className="rounded-2xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <Th>ID</Th>
                <Th>Status</Th>
                <Th>Member</Th>
                <Th>Codes</Th>
                <Th>Updated</Th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((r) => (
                <tr
                  key={r.id}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/requests/${encodeURIComponent(r.id)}`)}
                >
                  <Td mono>{r.id.slice(0, 8)}…</Td>
                  <Td>{r.status}</Td>
                  <Td>{r.memberName || r.memberId || '—'}</Td>
                  <Td>{r.codes?.join(', ') || '—'}</Td>
                  <Td>
                    {r.updatedAt ? new Date(r.updatedAt).toLocaleString() : '—'}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          Showing {start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)} of {filtered.length}
          {typeof total === 'number' && filtered.length !== total ? ` (total: ${total})` : ''}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            disabled={pageSafe <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <span className="text-sm">{pageSafe} / {totalPages}</span>
          <Button
            variant="secondary"
            disabled={pageSafe >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </main>
  )
}

/* ---------- tiny presentational bits ---------- */

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={[
        'h-9 rounded-full border px-3 text-sm',
        active ? 'bg-black text-white border-black' : 'hover:bg-gray-50',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="p-3 font-medium text-gray-600">{children}</th>
}

function Td({ children, mono = false }: { children: React.ReactNode; mono?: boolean }) {
  return <td className={`p-3 ${mono ? 'font-mono' : ''}`}>{children}</td>
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
