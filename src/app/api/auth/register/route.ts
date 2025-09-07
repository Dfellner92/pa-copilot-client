import { NextRequest, NextResponse } from 'next/server'
import { proxyBackend } from '@/lib/proxy'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    const response = await proxyBackend('/v1/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
      timeoutMs: 10000,
    })

    const responseText = await response.text()
    
    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        'content-type': 'application/json',
      },
    })
  } catch (err: any) {
    console.error('[register] proxy failed:', err)
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 })
  }
}
