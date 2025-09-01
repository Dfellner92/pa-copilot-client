import { NextResponse } from 'next/server'
import { proxyBackend } from '@/lib/proxy'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const res = await proxyBackend(`/v1/prior-auth/requests/${encodeURIComponent(params.id)}`, {
    method: 'GET',
    // do NOT set next: { revalidate: ... } here – keep it fresh:
    // cache: 'no-store' is applied inside proxyBackend; if not, add it there
  })

  // IMPORTANT: don’t reshape. Just stream through whatever backend returns.
  const json = await res.json().catch(() => ({}))
  return NextResponse.json(json, { status: res.status })
}
