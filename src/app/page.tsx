'use client'

import { useUser } from './contexts/UserContext'
import { TemplateBrowserStack } from './components/TemplateBrowserStack'
import { LandingPage } from './components/LandingPage'

export default function Home() {
  const { user, isAuthLoading } = useUser()

  // Show nothing while checking auth state
  if (isAuthLoading) {
    return null
  }

  // Show landing page for unauthenticated users
  if (!user) {
    return <LandingPage />
  }

  // Show template browser for authenticated users
  return (
    <div className="p-3 flex-grow space-y-8 max-h-full overflow-y-auto">
      <TemplateBrowserStack />
    </div>
  )
}
