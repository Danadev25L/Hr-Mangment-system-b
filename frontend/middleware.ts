import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from "next-intl/middleware";

import { routing } from "./i18next/routing";

// Create the next-intl middleware
const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  // Skip locale prefix for API routes, static files, and Next.js internals
  if (
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value || request.headers.get('authorization')?.replace('Bearer ', '')

  // Extract locale from pathname
  const localeMatch = request.nextUrl.pathname.match(/^\/(en|ku|ar)/);
  const currentLocale = localeMatch ? localeMatch[1] : routing.defaultLocale;
  
  // If no locale in path and not root, redirect to include default locale
  if (!localeMatch && request.nextUrl.pathname !== '/') {
    const pathWithLocale = `/${routing.defaultLocale}${request.nextUrl.pathname}`;
    const redirectUrl = new URL(pathWithLocale, request.url);
    redirectUrl.search = request.nextUrl.search; // Preserve query params
    return NextResponse.redirect(redirectUrl);
  }

  // Get path without locale for public path checking
  const pathWithoutLocale = request.nextUrl.pathname.replace(/^\/(en|ku|ar)/, '') || '/';

  // Define public paths (without locale prefix)
  const publicPaths = ['/', '/login', '/register']
  const isPublicPath = publicPaths.some(path =>
    pathWithoutLocale === path || pathWithoutLocale.startsWith(path + '/')
  );

  // Handle locale detection and redirect for root path
  if (request.nextUrl.pathname === '/') {
    // Check if user has a preferred locale in cookie or Accept-Language header
    const preferredLocale = request.cookies.get('NEXT_LOCALE')?.value ||
                           request.headers.get('accept-language')?.split(',')[0]?.split('-')[0];

    // Use preferred locale if it's supported, otherwise use default
    const locale = (preferredLocale && routing.locales.includes(preferredLocale as any)) 
      ? preferredLocale 
      : routing.defaultLocale;

    // If user has token, redirect to their dashboard, otherwise to login
    const redirectPath = token ? `/${locale}/employee/dashboard` : `/${locale}/login`;
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
    // Default to employee dashboard - will be redirected based on role in localStorage
    const dashboardUrl = new URL(`/${currentLocale}/employee/dashboard`, request.url);
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