import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

function readJwtExp(token: string | undefined): number | null {
  if (!token) return null
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1] || '', 'base64').toString('utf8'))
    return typeof payload?.exp === 'number' ? payload.exp : null
  } catch {
    return null
  }
}

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieName = process.env.JWT_COOKIE_NAME || 'pa_token'
  const token = (await cookies()).get(cookieName)?.value
  const exp = readJwtExp(token)
  const now = Math.floor(Date.now() / 1000)
  const valid = !!token && !!exp && exp > now

  if (!valid) redirect('/login')
  return <>{children}</>
}
