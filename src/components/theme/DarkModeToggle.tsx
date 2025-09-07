'use client'
import { useTheme } from '@/components/theme/ThemeProvider'
import { Button } from '../ui/Button'

export const DarkModeToggle = () => {
  const { theme, toggle } = useTheme()
  
  return (
    <Button 
      onClick={toggle} 
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </Button>
  )
}