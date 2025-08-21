import { NextRequest, NextResponse } from 'next/server'
import { proxyBackend } from '@/lib/proxy'

type Params = { params: { id: string } }

export async function GET(_: Request, { params }: Params) {
    const res = await proxyBackend(`/v1/prior-auth/requests/${encodeURIComponent(params.id)}`)
    const json = await res.json()
    return NextResponse.json(json, { status: res.status })
}