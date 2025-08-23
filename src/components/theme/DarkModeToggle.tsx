'use client'
import { useTheme } from '@/components/theme/ThemeProvider'

export const DarkModeToggle = () => {
  const { theme, toggle } = useTheme()
  return (
    <button onClick={toggle} className="btn ml-2" aria-label="Toggle theme">
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
