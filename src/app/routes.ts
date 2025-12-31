/**
 * Centralized route definitions and helpers
 */

export const ROUTES = {
  HOME: '/',
  TEMPLATES: '/templates',
  LIBRARY: '/library',
  SHARE: '/share',
  PRIVACY: '/privacy',
  TERMS: '/terms',
} as const;

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
  return !!pathname && pathname.startsWith('/templates/') && pathname !== ROUTES.TEMPLATES;
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
