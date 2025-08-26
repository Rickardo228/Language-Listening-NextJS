import type { Metadata } from "next";
import {
  Playpen_Sans,
  M_PLUS_Rounded_1c,
} from "next/font/google";
import "./globals.css";
import { ThemeProvider } from './ThemeProvider'
import { UserContextProvider } from './contexts/UserContext'
import { SidebarProvider } from './contexts/SidebarContext'
import MixpanelProvider from './components/MixpanelProvider'
import { AppLayout } from './components/AppLayout'

const playpenSans = Playpen_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-playpen-sans",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"],
});

const mPlusRounded1c = M_PLUS_Rounded_1c({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mplus-rounded",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"],
});

export const metadata: Metadata = {
  title: "Language Shadowing",
  description: "Practice language shadowing with AI-generated content",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playpenSans.variable} ${mPlusRounded1c.variable} antialiased`} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <UserContextProvider>
            <SidebarProvider>
              <MixpanelProvider>
                <AppLayout>
                  {children}
                </AppLayout>
              </MixpanelProvider>
            </SidebarProvider>
          </UserContextProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
