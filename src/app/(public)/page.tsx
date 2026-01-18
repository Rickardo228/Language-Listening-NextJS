import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LandingPage } from '../components/LandingPage';
import { ROUTES } from '../routes';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.languageshadowing.com';
const DEFAULT_OG_IMAGE = '/hero-image.jpg';

function buildAbsoluteUrl(path: string) {
  const baseUrl = SITE_URL.endsWith('/') ? SITE_URL.slice(0, -1) : SITE_URL;
  return new URL(path, `${baseUrl}/`).toString();
}

export const metadata: Metadata = {
  title: 'Language Shadowing',
  description: 'Practice language shadowing with AI-generated content.',
  alternates: {
    canonical: buildAbsoluteUrl('/'),
  },
  openGraph: {
    title: 'Language Shadowing',
    description: 'Practice language shadowing with AI-generated content.',
    url: buildAbsoluteUrl('/'),
    siteName: 'Language Shadowing',
    type: 'website',
    images: [
      {
        url: buildAbsoluteUrl(DEFAULT_OG_IMAGE),
        width: 1200,
        height: 630,
        alt: 'Language Shadowing',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Language Shadowing',
    description: 'Practice language shadowing with AI-generated content.',
    images: [buildAbsoluteUrl(DEFAULT_OG_IMAGE)],
  },
};

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
