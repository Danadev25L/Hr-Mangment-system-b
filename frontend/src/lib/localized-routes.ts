/**
 * Utility functions for handling localized routing
 */

/**
 * Creates a localized path by prepending the current locale
 * @param locale - The current locale (e.g., 'en', 'ku', 'ar')
 * @param path - The path to localize (e.g., '/admin/dashboard')
 * @returns The localized path (e.g., '/en/admin/dashboard')
 */
export const createLocalizedPath = (locale: string, path: string): string => {
  // Remove leading slash from path if it exists to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `/${locale}/${cleanPath}`
}

/**
 * Gets the current locale from a pathname
 * @param pathname - The current pathname (e.g., '/en/admin/dashboard')
 * @returns The locale (e.g., 'en') or 'en' as fallback
 */
export const getCurrentLocale = (pathname: string): string => {
  const pathSegments = pathname.split('/')
  return pathSegments[1] || 'en'
}

/**
 * Creates a localized redirect function for Next.js router
 * @param router - Next.js router instance
 * @param pathname - Current pathname to extract locale from
 * @returns A function that accepts a path and routes to the localized version
 */
export const createLocalizedRedirect = (
  router: any,
  pathname: string
) => {
  const locale = getCurrentLocale(pathname)

  return (path: string) => {
    const localizedPath = createLocalizedPath(locale, path)
    router.push(localizedPath)
  }
}