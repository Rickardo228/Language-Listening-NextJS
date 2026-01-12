'use client'

import { Suspense } from 'react'
import { SignInPage } from '../../SignInPage'
import { useRouter } from 'next/navigation'
import { ROUTES } from '../../routes'

export default function SignIn() {
  const router = useRouter()

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Suspense
        fallback={(
          <div className="flex items-center justify-center min-h-[40vh] w-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
      >
        <SignInPage
          title="Language Shadowing"
          description="Master languages through shadowing practice"
          onAuthSuccess={() => {
            router.push(ROUTES.HOME)
          }}
        />
      </Suspense>
    </div>
  )
}
