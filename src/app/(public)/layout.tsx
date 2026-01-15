import { ThemeProvider } from '../ThemeProvider'
import { CookieConsent } from '../components/CookieConsent'
import { Toaster } from 'sonner'
import { PublicNav } from '../components/PublicNav'
import { Footer } from '../components/Footer'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider>
      <Toaster
        richColors
        toastOptions={{
          classNames: {
            toast: 'bg-background text-foreground border-border',
          },
        }}
      />
      <PublicNav />
      <main>
        {children}
      </main>
      <Footer />
      <CookieConsent />
    </ThemeProvider>
  )
}
