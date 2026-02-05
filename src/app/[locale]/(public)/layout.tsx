import { ThemeProvider } from '@/app/ThemeProvider'
import { CookieConsent } from '@/app/components/CookieConsent'
import { Toaster } from 'sonner'
import { PublicNav } from '@/app/components/PublicNav'
import { Footer } from '@/app/components/Footer'
import MixpanelProvider from '@/app/components/MixpanelProvider'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider>
      <Toaster
        richColors
        expand
        position="top-center"
        toastOptions={{
          classNames: {
            toast: 'bg-background text-foreground border-border font-sans text-center whitespace-pre-line',
          },
          style: {
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
          },
        }}
      />
      <MixpanelProvider>
        <PublicNav />
        <main>
          {children}
        </main>
        <Footer />
        <CookieConsent />
      </MixpanelProvider>
    </ThemeProvider>
  )
}
