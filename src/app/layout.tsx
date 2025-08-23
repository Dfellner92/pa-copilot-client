import './globals.css'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { ThemeProvider } from '@/components/theme/ThemeProvider'

export const metadata: Metadata = { title: 'PA Copilot', description: 'Frontend' }

const getInitialTheme = async (): Promise<'light' | 'dark'> => {
  const c = (await cookies()).get('theme')?.value
  return c === 'dark' ? 'dark' : 'light'
}

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const initialTheme = await getInitialTheme()
  // render correct class on first paint to avoid flash
  return (
    <html lang="en" className={initialTheme === 'dark' ? 'dark' : ''} suppressHydrationWarning>
      <body className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <ThemeProvider initialTheme={initialTheme}>{children}</ThemeProvider>
      </body>
    </html>
  )
}

export default RootLayout;
