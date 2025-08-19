import { cookies } from 'next/headers'

export async function proxyBackend(path: string, init: RequestInit = {}) {
  const base = process.env.BACKEND_URL!
  const url = `${base}${path}`

  const token = (await cookies()).get(process.env.JWT_COOKIE_NAME || 'pa_token')?.value
  const h = new Headers(init.headers || {})
  if (token) h.set('Authorization', `Bearer ${token}`)

  // forward content-type unless already set by caller
  if (!h.has('Content-Type') && init.body && typeof init.body !== 'string') {
    // leave as is for FormData/Blob/etc.
  }

  const res = await fetch(url, {
    ...init,
    headers: h,
    cache: 'no-store', // avoid stale auth
    next: { revalidate: 0 },
  })

  if (process.env.DEBUG_PROXY === 'true') {
    console.log(`[proxy] ${init.method || 'GET'} ${path} → ${res.status}`)
  }

  return res
}