import type { Metadata } from "next";
import {
  Playpen_Sans,
  M_PLUS_Rounded_1c,
} from "next/font/google";
import "./globals.css";
import { ThemeProvider } from './ThemeProvider'
import { UserContextProvider } from './contexts/UserContext'

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
    <html lang="en" className={`${playpenSans.variable} ${mPlusRounded1c.className} antialiased`} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <UserContextProvider>
            {children}
          </UserContextProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
