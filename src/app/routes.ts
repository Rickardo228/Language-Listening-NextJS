/**
 * Centralized route definitions and helpers
 */

export const ROUTES = {
  HOME: '/',
  TEMPLATES: '/templates',
  TEMPLATE_PUBLIC: '/t',
  LIBRARY: '/library',
  SHARE: '/share',
  PRIVACY: '/privacy',
  TERMS: '/terms',
} as const;

// SEO language route patterns (/{language}/{slug})
const SEO_LANGUAGE_PATTERNS = ['italian', 'spanish', 'japanese'] as const;

export const PUBLIC_ROUTE_ROOTS = [
  ROUTES.TEMPLATE_PUBLIC,
  ROUTES.SHARE,
  ROUTES.PRIVACY,
  ROUTES.TERMS,
] as const;

function getRouteRoot(pathname: string | null): string | null {
  if (!pathname) return null;
  if (pathname === ROUTES.HOME) return ROUTES.HOME;
  const [rootSegment] = pathname.split('/').filter(Boolean);
  return rootSegment ? `/${rootSegment}` : ROUTES.HOME;
}

function matchesRouteRoot(pathname: string | null, roots: readonly string[]): boolean {
  if (!pathname) return false;
  const routeRoot = getRouteRoot(pathname);
  return !!routeRoot && roots.some((root) => (
    root === ROUTES.HOME ? pathname === ROUTES.HOME : pathname === root || pathname.startsWith(`${root}/`)
  ));
}

/**
 * Check if the current route is public (no auth required)
 */
export function isPublicRoute(pathname: string | null): boolean {
  if (!pathname) return false;

  // Check SEO language pages: /{language}/{slug}
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length >= 2 && SEO_LANGUAGE_PATTERNS.includes(segments[0] as any)) {
    return true;
  }

  return matchesRouteRoot(pathname, PUBLIC_ROUTE_ROOTS);
}

/**
 * Check if the current route is private (auth required)
 */
export function isPrivateRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return !isPublicRoute(pathname);
}

/**
 * Check if the current path is the home page
 */
export function isHomePage(pathname: string | null): boolean {
  return pathname === ROUTES.HOME;
}

/**
 * Check if the current path is the templates browse page
 */
export function isTemplatesPage(pathname: string | null): boolean {
  return pathname === ROUTES.TEMPLATES;
}

/**
 * Check if the current path is a specific template detail page
 */
export function isTemplateDetailPage(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname.startsWith(`${ROUTES.TEMPLATE_PUBLIC}/`)) return true;
  return pathname.startsWith('/templates/') && pathname !== ROUTES.TEMPLATES;
}

/**
 * Check if the current path is a specific collection detail page
 */
export function isCollectionDetailPage(pathname: string | null): boolean {
  return !!pathname && pathname.startsWith('/collection/');
}

/**
 * Check if sidebar should be hidden for the current route
 */
export function shouldHideSidebar(pathname: string | null): boolean {
  return !!pathname && (
    pathname.startsWith(ROUTES.LIBRARY) ||
    pathname.startsWith(ROUTES.SHARE) ||
    pathname.startsWith(ROUTES.PRIVACY) ||
    pathname.startsWith(ROUTES.TERMS)
  );
}

/**
 * Check if bottom navigation should be hidden for the current route
 */
export function shouldHideBottomNav(pathname: string | null): boolean {
  // Don't hide bottom nav on library page
  if (pathname === ROUTES.LIBRARY) return false;

  return shouldHideSidebar(pathname) ||
    isCollectionDetailPage(pathname) ||
    isTemplateDetailPage(pathname);
}

/**
 * Extract collection ID from collection detail route
 */
export function getCollectionIdFromPath(pathname: string | null): string {
  if (!pathname || !pathname.startsWith('/collection/')) return '';
  return pathname.split('/collection/')[1] || '';
}
