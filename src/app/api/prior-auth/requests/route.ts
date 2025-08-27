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

export async function GET(req: NextRequest) {
  // Pass through optional query params if backend supports them
  const url = new URL(req.url)
  const qs = url.search ? url.search : ''
  const res = await proxyBackend(`/v1/prior-auth/requests${qs}`, { method: 'GET' })

  // If your backend returns a plain array, we wrap it; if it returns {items,total}, just pass along.
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}