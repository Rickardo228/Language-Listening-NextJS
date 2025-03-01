import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Playpen_Sans,
  M_PLUS_Rounded_1c,
} from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playpenSans = Playpen_Sans({
  variable: "--font-playpen-sans",
  subsets: ["latin"],
});

const mPlusRounded1c = M_PLUS_Rounded_1c({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Learn a Language",
  description: "Learn a Language by Listening and Speaking",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playpenSans.variable} ${mPlusRounded1c.className} antialiased`}>
      <body>{children}</body>
    </html>
  )
}
