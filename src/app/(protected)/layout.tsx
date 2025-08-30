// frontend/app/(protected)/layout.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'

const decodeJwt = (token: string | undefined): any | null => {
  if (!token) return null
  try {
    return JSON.parse(Buffer.from(token.split('.')[1] || '', 'base64').toString('utf8'))
  } catch {
    return null
  }
}

const ProtectedLayout = async ({ children }: { children: React.ReactNode }) => {
  const cookieName = process.env.JWT_COOKIE_NAME || 'pa_token'
  const token = (await cookies()).get(cookieName)?.value
  const payload = decodeJwt(token)

  const now = Math.floor(Date.now() / 1000)
  const exp = payload?.exp as number | undefined
  const valid = !!token && !!exp && exp > now
  if (!valid) redirect('/login')

  // ← NEW: coerce roles to an array and check
  const rawRoles = payload?.roles
  const roles: string[] =
    Array.isArray(rawRoles)
      ? rawRoles
      : typeof rawRoles === 'string'
        ? rawRoles.split(/[,\s]+/).filter(Boolean)
        : []

  const hasClinician = roles.includes('clinician')
  if (!hasClinician) redirect('/login')

  return <AppShell>{children}</AppShell>
}

export default ProtectedLayout
