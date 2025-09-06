'use client'
import { useTheme } from '@/components/theme/ThemeProvider'

export const DarkModeToggle = () => {
  const { theme, toggle } = useTheme()
  
  return (
    <button 
      onClick={toggle} 
      className="ml-2 p-2 rounded-lg bg-black dark:bg-white text-black dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-600 dark:hover:bg-gray-800 transition-colors" 
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}