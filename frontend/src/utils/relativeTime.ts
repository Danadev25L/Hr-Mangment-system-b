import { useTranslations } from 'next-intl'

export const useRelativeTime = () => {
  const t = useTranslations('notifications')

  const getRelativeTime = (dateString: string | null): string => {
    if (!dateString) return ''

    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

      // Simple fallback without translations for debugging
      const getFallbackText = (seconds: number) => {
        if (seconds < 60) return 'Just now'
        const minutes = Math.floor(seconds / 60)
        if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
        const days = Math.floor(hours / 24)
        if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`
        return date.toLocaleDateString()
      }

      if (diffInSeconds < 60) {
        try {
          return t('time.justNow')
        } catch {
          return 'Just now'
        }
      }

      const diffInMinutes = Math.floor(diffInSeconds / 60)
      if (diffInMinutes < 60) {
        try {
          return t('time.minutesAgo', { count: diffInMinutes })
        } catch {
          return getFallbackText(diffInSeconds)
        }
      }

      const diffInHours = Math.floor(diffInMinutes / 60)
      if (diffInHours < 24) {
        try {
          return t('time.hoursAgo', { count: diffInHours })
        } catch {
          return getFallbackText(diffInSeconds)
        }
      }

      const diffInDays = Math.floor(diffInHours / 24)
      if (diffInDays < 7) {
        try {
          return t('time.daysAgo', { count: diffInDays })
        } catch {
          return getFallbackText(diffInSeconds)
        }
      }

      const diffInWeeks = Math.floor(diffInDays / 7)
      if (diffInWeeks < 4) {
        try {
          return t('time.weeksAgo', { count: diffInWeeks })
        } catch {
          return getFallbackText(diffInSeconds)
        }
      }

      const diffInMonths = Math.floor(diffInDays / 30)
      if (diffInMonths < 12) {
        try {
          return t('time.monthsAgo', { count: diffInMonths })
        } catch {
          return getFallbackText(diffInSeconds)
        }
      }

      const diffInYears = Math.floor(diffInDays / 365)
      try {
        return t('time.yearsAgo', { count: diffInYears })
      } catch {
        return getFallbackText(diffInSeconds)
      }
    } catch (error) {
      console.error('Error parsing date:', dateString, error)
      return 'Invalid date'
    }
  }

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return ''

    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return { getRelativeTime, formatDate }
}