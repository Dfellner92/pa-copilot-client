'use client'
import { useTheme } from '@/components/theme/ThemeProvider'

export const DarkModeToggle = () => {
  const { theme, toggle } = useTheme()
  
  const handleClick = () => {
    console.log('Current theme before toggle:', theme)
    toggle()
    console.log('Theme toggled to:', theme === 'dark' ? 'light' : 'dark')
  }
  
  return (
    <button 
      onClick={handleClick} 
      className="ml-2 p-2 rounded-lg bg-black dark:bg-white text-black dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-600 dark:hover:bg-gray-800 transition-colors" 
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}