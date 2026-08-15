type Locale = 'ar' | 'en'

const arLocale = 'ar-SA-u-nu-latn'

function resolveLocale(locale: Locale): string {
  return locale === 'ar' ? arLocale : 'en-GB'
}

export function formatDateShort(iso: string | Date, locale: Locale): string {
  return new Date(iso).toLocaleDateString(resolveLocale(locale), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateLong(iso: string | Date, locale: Locale): string {
  return new Date(iso).toLocaleDateString(resolveLocale(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
