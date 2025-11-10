import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from "next-intl/middleware";

import { routing } from "./i18next/routing";

// Create the next-intl middleware
const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // OPTIMIZATION: Fast path for static assets and API routes - bypass all checks
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.') // Any file with extension (images, fonts, etc.)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value || request.headers.get('authorization')?.replace('Bearer ', '')

  // Extract locale from pathname - Optimized regex
  const localeMatch = pathname.match(/^\/(en|ku|ar)/);
  const currentLocale = localeMatch ? localeMatch[1] : routing.defaultLocale;
  
  // OPTIMIZATION: Cache locale detection result in response headers
  const response = localeMatch ? NextResponse.next() : null;
  
  // If no locale in path and not root, redirect to include default locale
  if (!localeMatch && pathname !== '/') {
    const pathWithLocale = `/${routing.defaultLocale}${pathname}`;
    const redirectUrl = new URL(pathWithLocale, request.url);
    redirectUrl.search = request.nextUrl.search; // Preserve query params
    return NextResponse.redirect(redirectUrl);
  }

  // Get path without locale for public path checking
  const pathWithoutLocale = pathname.replace(/^\/(en|ku|ar)/, '') || '/';

  // Define public paths (without locale prefix) - OPTIMIZED: Use Set for O(1) lookup
  const publicPathsSet = new Set(['/', '/login', '/register']);
  const isPublicPath = publicPathsSet.has(pathWithoutLocale) || 
                       pathWithoutLocale.startsWith('/login/') || 
                       pathWithoutLocale.startsWith('/register/');

  // Handle locale detection and redirect for root path
  if (request.nextUrl.pathname === '/') {
    // Check if user has a preferred locale in cookie or Accept-Language header
    const preferredLocale = request.cookies.get('NEXT_LOCALE')?.value ||
                           request.headers.get('accept-language')?.split(',')[0]?.split('-')[0];

    // Use preferred locale if it's supported, otherwise use default
    const locale = (preferredLocale && routing.locales.includes(preferredLocale as any)) 
      ? preferredLocale 
      : routing.defaultLocale;

    // If user has token, redirect to their dashboard based on role, otherwise to login
    let redirectPath = `/${locale}/login`;
    
    if (token) {
      const userRole = request.cookies.get('userRole')?.value;
      
      if (userRole === 'ROLE_ADMIN') {
        redirectPath = `/${locale}/admin/dashboard`;
      } else if (userRole === 'ROLE_MANAGER') {
        redirectPath = `/${locale}/manager/dashboard`;
      } else {
        redirectPath = `/${locale}/employee/dashboard`;
      }
    }
    
    const redirectUrl = new URL(redirectPath, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to login if no token on protected routes
  if (!isPublicPath && !token) {
    const loginUrl = new URL(`/${currentLocale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If user has a token and is trying to access login page, redirect to role-specific dashboard
  if (token && pathWithoutLocale === '/login') {
    // Get user role from cookie
    const userRole = request.cookies.get('userRole')?.value;
    let dashboardPath = '/employee/dashboard'; // default
    
    if (userRole === 'ROLE_ADMIN') {
      dashboardPath = '/admin/dashboard';
    } else if (userRole === 'ROLE_MANAGER') {
      dashboardPath = '/manager/dashboard';
    } else if (userRole === 'ROLE_EMPLOYEE') {
      dashboardPath = '/employee/dashboard';
    }
    
    const dashboardUrl = new URL(`/${currentLocale}${dashboardPath}`, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Ensure the URL has a locale prefix for authenticated users
  if (token && !localeMatch) {
    const urlWithLocale = new URL(`/${routing.defaultLocale}${request.nextUrl.pathname}`, request.url);
    return NextResponse.redirect(urlWithLocale);
  }

  // Apply the internationalization middleware
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for API routes, static files, and Next.js internals
  matcher: [
    '/',
    '/(en|ku|ar)/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)'
  ],
};