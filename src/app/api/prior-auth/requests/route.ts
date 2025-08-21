import { NextRequest, NextResponse } from 'next/server'
import { proxyBackend } from '@/lib/proxy'

export async function POST(req: NextRequest) {
  const payload = await req.json()
  const res = await proxyBackend('/v1/prior-auth/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  return NextResponse.json(json, { status: res.status })
}