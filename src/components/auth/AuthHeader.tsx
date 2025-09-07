'use client'
import { DarkModeToggle } from '@/components/theme/DarkModeToggle'
import { LogoutButton } from './LogoutButton'
import { useIsAuthenticated } from '@/hooks/useIsAuthenticated'

export const AuthHeader = () => {
  const isAuthenticated = useIsAuthenticated()

  return (
    <div className="flex items-center">
      {isAuthenticated === true && <LogoutButton />}
      <DarkModeToggle />
    </div>
  )
}
