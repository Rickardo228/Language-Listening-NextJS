import { ThemeProvider } from '../ThemeProvider'
import { UserContextProvider } from '../contexts/UserContext'
import { SidebarProvider } from '../contexts/SidebarContext'
import MixpanelProvider from '../components/MixpanelProvider'
import { AppLayout } from '../components/AppLayout'
import { CookieConsent } from '../components/CookieConsent'
import { Toaster } from 'sonner'

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
            toast: 'bg-background text-foreground border-border',
          },
        }}
      />
      <UserContextProvider>
        <SidebarProvider>
          <MixpanelProvider>
            <AppLayout>
              {children}
            </AppLayout>
            <CookieConsent />
          </MixpanelProvider>
        </SidebarProvider>
      </UserContextProvider>
    </ThemeProvider>
  )
}
