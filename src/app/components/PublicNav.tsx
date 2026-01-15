'use client'

import Link from 'next/link'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../ThemeProvider'
import { Button } from './ui/Button'
import { ROUTES } from '../routes'

export function PublicNav() {
  const { theme, toggleTheme } = useTheme()

  return (
    <nav className="flex items-center justify-between shadow-md p-3 sticky top-0 bg-background border-b z-50">
      {/* Left - Logo */}
      <Link href={ROUTES.LANDING} className="flex items-center gap-3 text-2xl hover:opacity-80 transition-opacity">
        <img
          src={theme === 'light' ? '/language-shadowing-logo-dark.png' : '/language-shadowing-logo-white.png'}
          alt="Language Shadowing Logo"
          className="w-8 h-8 sm:ml-2 sm:mt-0.5"
        />
        <h1 className="hidden sm:block">Language Shadowing</h1>
      </Link>

      {/* Right - CTA + Theme */}
      <div className="flex items-center gap-4">
        <Link href={`${ROUTES.SIGNIN}?mode=signin`}>
          <Button variant="ghost" size="sm">
            Log in
          </Button>
        </Link>
        <Link href={ROUTES.GET_STARTED}>
          <Button size="sm">
            Get started
          </Button>
        </Link>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-secondary hover:bg-secondary/80"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5" strokeWidth={1.5} />
          ) : (
            <Sun className="w-5 h-5" strokeWidth={1.5} />
          )}
        </button>
      </div>
    </nav>
  )
}
