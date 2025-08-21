import { cookies } from 'next/headers'

export async function proxyBackend(path: string, init: RequestInit = {}) {
  const base = process.env.BACKEND_URL!
  const url = `${base}${path}`

  const token = (await cookies()).get(process.env.JWT_COOKIE_NAME || 'pa_token')?.value
  const headers = new Headers(init.headers || {})
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(url, {
    ...init,
    headers,
    cache: 'no-store',
    next: { revalidate: 0 },
  })

  if (process.env.DEBUG_PROXY === 'true') {
    console.log(`[proxy] ${init.method || 'GET'} ${path} → ${res.status}`)
  }

  return res
}