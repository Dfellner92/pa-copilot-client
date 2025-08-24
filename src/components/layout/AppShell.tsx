'use client'
import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  const pathname = usePathname()

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  const baseLink = 'btn nav'
  const activeLink = 'active'

  return (
    <div className="flex min-h-screen bg-white dark:bg-black text-black dark:text-white">
      {/* Sidebar */}
      <aside
        className={`transition-all border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-black ${
          open ? 'w-56' : 'w-14'
        }`}
      >
        <div className="flex items-center justify-between p-4">
          <span className={`font-bold text-black dark:text-white ${open ? '' : 'hidden'}`}>
            Sidebar
          </span>
          <button
            onClick={() => setOpen(!open)}
            className="flex-shrink-0 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
          >
            {open ? '«' : '»'}
          </button>
        </div>
        <nav className="flex flex-col space-y-1 px-2">
          <Link
            href="/dashboard"
            className={`${baseLink} ${open ? '' : 'justify-center'} ${
              isActive('/dashboard') ? activeLink : ''
            }`}
            aria-current={isActive('/dashboard') ? 'page' : undefined}
          >
            {open ? 'Dashboard' : 'D'}
          </Link>

          <Link
            href="/requests"
            className={`${baseLink} ${open ? '' : 'justify-center'} ${
              isActive('/requests') ? activeLink : ''
            }`}
            aria-current={isActive('/requests') ? 'page' : undefined}
          >
            {open ? 'Requests' : 'R'}
          </Link>

          <Link
            href="/requests/new"
            className={`${baseLink} ${open ? '' : 'justify-center'} ${
              isActive('/requests/new') ? activeLink : ''
            }`}
            aria-current={isActive('/requests/new') ? 'page' : undefined}
          >
            {open ? 'New Request' : 'N'}
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
