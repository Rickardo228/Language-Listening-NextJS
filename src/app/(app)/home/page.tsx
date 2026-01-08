'use client'

import { useUser } from '../../contexts/UserContext'
import { TemplateBrowserStack } from '../../components/TemplateBrowserStack'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ROUTES } from '../../routes'

export default function Home() {
  const { user, isAuthLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    // Redirect to landing page if not authenticated
    if (!isAuthLoading && !user) {
      router.push(ROUTES.LANDING)
    }
  }, [user, isAuthLoading, router])

  // Show nothing while checking auth state or redirecting
  if (isAuthLoading || !user) {
    return null
  }

  // Show template browser for authenticated users
  return (
    <div className="p-3 flex-grow space-y-8 max-h-full overflow-y-auto">
      <TemplateBrowserStack />
    </div>
  )
}
