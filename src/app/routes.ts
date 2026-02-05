/**
 * Centralized route definitions and helpers
 */

import { routing } from '@/i18n/routing';

export const ROUTES = {
  LANDING: '/',
  HOME: '/home',
  SIGNIN: '/signin',
  GET_STARTED: '/get-started',
  TRY_LESSON: '/try-a-lesson',
  TEMPLATES: '/templates',
  TEMPLATE_PUBLIC: '/t',
  LIBRARY: '/library',
  SHARE: '/share',
  PRIVACY: '/privacy',
  TERMS: '/terms',
} as const;

// SEO language route patterns (/{language}/{slug})
const SEO_LANGUAGE_PATTERNS = ['italian', 'spanish', 'japanese'] as const;

// SEO pillar route patterns (/{pillar}/{slug})
const SEO_PILLAR_PATTERNS = [
  'language-shadowing',
  'learn-italian',
  'learn-spanish',
  'learn-japanese',
] as const;

export const PUBLIC_ROUTE_ROOTS = [
  ROUTES.LANDING,
  ROUTES.GET_STARTED,
  ROUTES.TRY_LESSON,
  ROUTES.TEMPLATE_PUBLIC,
  ROUTES.SHARE,
  ROUTES.PRIVACY,
  ROUTES.TERMS,
] as const;

const PUBLIC_SINGLE_SEGMENT_ROUTES = [
  ...SEO_PILLAR_PATTERNS,
  ...SEO_LANGUAGE_PATTERNS,
] as const;

const LOCALE_PREFIXES = routing.locales
  .map((locale) => {
    if (typeof routing.localePrefix === 'string') {
      return `/${locale}`;
    }

    const customPrefix = routing.localePrefix?.prefixes?.[locale as keyof typeof routing.localePrefix.prefixes];
    if (customPrefix) return customPrefix;

    if (routing.localePrefix?.mode === 'as-needed' && locale === routing.defaultLocale) {
      return '';
    }

    return `/${locale}`;
  })
  .filter((prefix): prefix is string => Boolean(prefix));

function normalizePathname(pathname: string | null): string | null {
  if (!pathname) return null;

  for (const prefix of LOCALE_PREFIXES) {
    if (!prefix) continue;
    if (pathname === prefix) return ROUTES.LANDING;
    if (pathname.startsWith(`${prefix}/`)) {
      return pathname.slice(prefix.length) || ROUTES.LANDING;
    }
  }

  return pathname;
}

function getRouteRoot(pathname: string | null): string | null {
  const normalizedPathname = normalizePathname(pathname);
  if (!normalizedPathname) return null;
  if (normalizedPathname === ROUTES.LANDING) return ROUTES.LANDING;
  const [rootSegment] = normalizedPathname.split('/').filter(Boolean);
  return rootSegment ? `/${rootSegment}` : ROUTES.LANDING;
}

function matchesRouteRoot(pathname: string | null, roots: readonly string[]): boolean {
  const normalizedPathname = normalizePathname(pathname);
  if (!normalizedPathname) return false;
  const routeRoot = getRouteRoot(normalizedPathname);
  return !!routeRoot && roots.some((root) => (
    root === ROUTES.LANDING ? normalizedPathname === ROUTES.LANDING : normalizedPathname === root || normalizedPathname.startsWith(`${root}/`)
  ));
}

/**
 * Check if the current route is public (no auth required)
 */
export function isPublicRoute(pathname: string | null): boolean {
  const normalizedPathname = normalizePathname(pathname);
  if (!normalizedPathname) return false;

  // Check SEO language pages: /{language}/{slug}
  const segments = normalizedPathname.split('/').filter(Boolean);
  if (
    segments.length >= 2 &&
    (SEO_LANGUAGE_PATTERNS.includes(segments[0] as any) ||
      SEO_PILLAR_PATTERNS.includes(segments[0] as any))
  ) {
    return true;
  }

  if (segments.length === 1 && PUBLIC_SINGLE_SEGMENT_ROUTES.includes(segments[0] as any)) {
    return true;
  }

  return matchesRouteRoot(normalizedPathname, PUBLIC_ROUTE_ROOTS);
}

/**
 * Check if the current route is private (auth required)
 */
export function isPrivateRoute(pathname: string | null): boolean {
  const normalizedPathname = normalizePathname(pathname);
  if (!normalizedPathname) return false;
  return !isPublicRoute(normalizedPathname);
}

/**
 * Check if the current path is the authenticated home page
 */
export function isHomePage(pathname: string | null): boolean {
  const normalizedPathname = normalizePathname(pathname);
  return normalizedPathname === ROUTES.HOME;
}

/**
 * Check if the current path is the landing page
 */
export function isLandingPage(pathname: string | null): boolean {
  const normalizedPathname = normalizePathname(pathname);
  return normalizedPathname === ROUTES.LANDING;
}

/**
 * Check if the current path is the templates browse page
 */
export function isTemplatesPage(pathname: string | null): boolean {
  const normalizedPathname = normalizePathname(pathname);
  return normalizedPathname === ROUTES.TEMPLATES;
}

/**
 * Check if the current path is a specific template detail page
 */
export function isTemplateDetailPage(pathname: string | null): boolean {
  const normalizedPathname = normalizePathname(pathname);
  if (!normalizedPathname) return false;
  if (normalizedPathname.startsWith(`${ROUTES.TEMPLATE_PUBLIC}/`)) return true;
  return normalizedPathname.startsWith('/templates/') && normalizedPathname !== ROUTES.TEMPLATES;
}

/**
 * Check if the current path is a specific collection detail page
 */
export function isCollectionDetailPage(pathname: string | null): boolean {
  const normalizedPathname = normalizePathname(pathname);
  return !!normalizedPathname && normalizedPathname.startsWith('/collection/');
}

/**
 * Check if sidebar should be hidden for the current route
 */
export function shouldHideSidebar(pathname: string | null): boolean {
  const normalizedPathname = normalizePathname(pathname);
  return !!normalizedPathname && (
    normalizedPathname.startsWith(ROUTES.GET_STARTED) ||
    normalizedPathname.startsWith(ROUTES.LIBRARY) ||
    normalizedPathname.startsWith(ROUTES.SHARE) ||
    normalizedPathname.startsWith(ROUTES.PRIVACY) ||
    normalizedPathname.startsWith(ROUTES.TERMS)
  );
}

/**
 * Check if bottom navigation should be hidden for the current route
 */
export function shouldHideBottomNav(pathname: string | null): boolean {
  // Don't hide bottom nav on library page
  const normalizedPathname = normalizePathname(pathname);
  if (normalizedPathname === ROUTES.LIBRARY) return false;

  return shouldHideSidebar(normalizedPathname) ||
    isCollectionDetailPage(normalizedPathname) ||
    isTemplateDetailPage(normalizedPathname);
}

export function shouldHideTopNav(pathname: string | null): boolean {
  const normalizedPathname = normalizePathname(pathname);
  return !!normalizedPathname && normalizedPathname.startsWith(ROUTES.GET_STARTED);
}

/**
 * Extract collection ID from collection detail route
 */
export function getCollectionIdFromPath(pathname: string | null): string {
  const normalizedPathname = normalizePathname(pathname);
  if (!normalizedPathname || !normalizedPathname.startsWith('/collection/')) return '';
  return normalizedPathname.split('/collection/')[1] || '';
}
