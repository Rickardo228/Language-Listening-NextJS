import { ThemeProvider } from '../ThemeProvider'
import { UserContextProvider } from '../contexts/UserContext'
import { SidebarProvider } from '../contexts/SidebarContext'
import { CollectionsProvider } from '../contexts/CollectionsContext'
import MixpanelProvider from '../components/MixpanelProvider'
import { AppLayout } from '../components/AppLayout'
import { CookieConsent } from '../components/CookieConsent'
import { Toaster } from 'sonner'
import { Suspense } from 'react'

export default function AuthenticatedLayout({
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
      <UserContextProvider>
        <CollectionsProvider>
          <SidebarProvider>
            <MixpanelProvider>
              <Suspense fallback={null}>
                <AppLayout>
                  {children}
                </AppLayout>
              </Suspense>
              <CookieConsent />
            </MixpanelProvider>
          </SidebarProvider>
        </CollectionsProvider>
      </UserContextProvider>
    </ThemeProvider>
  )
}
