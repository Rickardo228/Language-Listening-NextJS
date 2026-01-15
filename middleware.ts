import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { nextUrl, cookies } = request;
  const hasCheckoutSuccess = nextUrl.searchParams.get('checkout') === 'success';
  const shouldRedirect = hasCheckoutSuccess && nextUrl.pathname === '/' && cookies.has('auth-hint');

  if (hasCheckoutSuccess) {
    const response = shouldRedirect
      ? NextResponse.redirect(new URL('/home', request.url))
      : NextResponse.next();
    response.cookies.set('checkout-success', '1', {
      path: '/',
      maxAge: 60 * 10,
      sameSite: 'lax',
      httpOnly: false,
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
