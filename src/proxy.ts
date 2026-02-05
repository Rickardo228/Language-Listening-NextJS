import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

const getLocalePrefix = (locale: string) => {
  if (typeof routing.localePrefix === 'string') {
    return `/${locale}`;
  }

  const customPrefix = routing.localePrefix?.prefixes?.[locale as keyof typeof routing.localePrefix.prefixes];
  if (customPrefix) return customPrefix;

  if (routing.localePrefix?.mode === 'as-needed' && locale === routing.defaultLocale) {
    return '';
  }

  return `/${locale}`;
};

const getAllLocalePrefixes = () =>
  routing.locales
    .map((locale) => getLocalePrefix(locale))
    .filter((prefix): prefix is string => Boolean(prefix));

const isLocaleRootPath = (pathname: string) =>
  pathname === '/' || getAllLocalePrefixes().some((prefix) => pathname === prefix);

const resolveLocaleFromPath = (pathname: string) =>
  routing.locales.find((locale) => {
    const prefix = getLocalePrefix(locale);
    if (!prefix) return pathname === '/' || !pathname.startsWith('/pt/');
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  }) ?? routing.defaultLocale;

export default function middleware(request: NextRequest) {
  let response = handleI18nRouting(request);

  const { nextUrl, cookies } = request;
  const hasCheckoutSuccess = nextUrl.searchParams.get('checkout') === 'success';

  if (hasCheckoutSuccess) {
    const resolvedUrl = response.headers.get('x-middleware-rewrite') ?? request.url;
    const resolvedPathname = new URL(resolvedUrl).pathname;
    const resolvedLocale = resolveLocaleFromPath(resolvedPathname);

    if (isLocaleRootPath(resolvedPathname) && cookies.has('auth-hint')) {
      response = NextResponse.redirect(
        new URL(`/${resolvedLocale}/home`, request.url),
        { headers: new Headers(response.headers) }
      );
    }

    response.cookies.set('checkout-success', '1', {
      path: '/',
      maxAge: 60 * 10,
      sameSite: 'lax',
      httpOnly: false,
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|trpc|_next|_vercel|.*\\..*).*)'],
};
