'use client'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Theme = 'light' | 'dark'
type Ctx = { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void }

const ThemeCtx = createContext<Ctx | null>(null)

export function useTheme() {
  const ctx = useContext(ThemeCtx)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}

export function ThemeProvider({
  children,
  initialTheme, // passed from server (cookie)
}: { children: React.ReactNode; initialTheme: Theme }) {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  // Keep <html> class and cookie in sync
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    // store both cookie + localStorage (cookie lets the server know on first paint)
    const secure = process.env.NODE_ENV === 'production'
    document.cookie = `theme=${theme}; path=/; max-age=31536000; SameSite=Lax${secure ? '; Secure' : ''}`
    try { localStorage.setItem('theme', theme) } 
    catch {}
  }, [theme])

  const value = useMemo(
    () => ({ theme, setTheme, toggle: () => setTheme(t => (t === 'dark' ? 'light' : 'dark')) }),
    [theme]
  )
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>
}
