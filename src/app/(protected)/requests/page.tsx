export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { headers } from 'next/headers'
import RequestsTableClient, { Row } from './RequestsTableClient'

export default async function Page() {
  const proto = (await headers()).get('x-forwarded-proto') ?? 'http'
  const host  = (await headers()).get('host')!
  const res = await fetch(`${proto}://${host}/api/prior-auth/requests?limit=200`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Failed to load requests (${res.status})`)
  const { items, total } = (await res.json()) as { items: Row[]; total: number }

  // Hand UI the raw list; all filtering/search/paging happens client-side
  return <RequestsTableClient initialItems={items} total={total} />
}
