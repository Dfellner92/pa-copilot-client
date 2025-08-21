import { NextRequest, NextResponse } from 'next/server'
import { proxyBackend } from '@/lib/proxy'

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const res = await proxyBackend('/v1/attachments', { method: 'POST', body: form })
  const json = await res.json()
  return NextResponse.json(json, { status: res.status })
}