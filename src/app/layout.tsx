import type { Metadata } from "next";
import {
  Playpen_Sans,
  M_PLUS_Rounded_1c,
} from "next/font/google";
import "./globals.css";
import { ThemeProvider } from './ThemeProvider'

const playpenSans = Playpen_Sans({
  variable: "--font-playpen-sans",
  subsets: ["latin"],
});

const mPlusRounded1c = M_PLUS_Rounded_1c({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
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
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
