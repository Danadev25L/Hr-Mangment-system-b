/**
 * Convert Western/Arabic numerals to Kurdish (Sorani) numerals
 */
export function toKurdishNumber(num: number | string): string {
  const kurdishDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
  
  return String(num).replace(/\d/g, (digit) => kurdishDigits[parseInt(digit)])
}

/**
 * Format number with locale-aware conversion
 */
export function formatNumber(num: number | string, locale: string): string {
  if (locale === 'ku' || locale === 'ar') {
    return toKurdishNumber(num)
  }
  return String(num)
}

/**
 * Format currency with Kurdish numbers if applicable
 */
export function formatCurrencyKurdish(amount: number, locale: string, currency: string = 'IQD'): string {
  const formatted = new Intl.NumberFormat(locale === 'ku' ? 'ar-IQ' : locale, {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
  
  if (locale === 'ku') {
    return toKurdishNumber(formatted)
  }
  
  return formatted
}

/**
 * Format percentage with Kurdish numbers if applicable
 */
export function formatPercentage(value: number, locale: string): string {
  const percentage = `${value.toFixed(1)}%`
  
  if (locale === 'ku' || locale === 'ar') {
    return toKurdishNumber(percentage)
  }
  
  return percentage
}
