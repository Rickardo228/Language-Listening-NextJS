'use client'

import { SignInPage } from '../SignInPage'
import { useRouter } from 'next/navigation'

export default function SignIn() {
  const router = useRouter()

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <SignInPage
        title="Language Shadowing"
        description="Master languages through shadowing practice"
        onAuthSuccess={() => {
          router.push('/')
        }}
      />
    </div>
  )
}
