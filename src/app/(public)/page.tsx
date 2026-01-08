import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { LandingPage } from '../components/LandingPage'
import { ROUTES } from '../routes'

export default async function Page() {
  const cookieStore = await cookies()
  const hasAuthHint = cookieStore.has('auth-hint')

  // If user has auth hint cookie, redirect to /home
  // This prevents flash of landing page for authenticated users
  if (hasAuthHint) {
    redirect(ROUTES.HOME)
  }

  // Server-render landing page for unauthenticated users
  // Perfect for SEO!
  return <LandingPage />
}
