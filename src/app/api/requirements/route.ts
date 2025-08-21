import { NextRequest, NextResponse } from 'next/server'
import { proxyBackend } from '@/lib/proxy'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })
  const res = await proxyBackend(`/v1/requirements?code=${encodeURIComponent(code)}`)
  const json = await res.json()
  return NextResponse.json(json, { status: res.status })
}