export type AutoConvertMode = 'text' | 'digits' | 'email' | 'url'
export type AutoConvertTextLanguage = 'any' | 'arabic' | 'english'

export type AutoConvertInvalidReason =
  | 'numbersOnlyDual'
  | 'textArabicOnlyDual'
  | 'textEnglishOnlyDual'
  | 'emailEnglishOnlyDual'
  | 'emailInvalidFormatDual'
  | 'urlEnglishOnlyDual'
  | 'urlInvalidFormatDual'

const HTTPS_PREFIX = 'https://'
const ARABIC_INDIC_DIGITS = /[٠-٩]/g
const EASTERN_ARABIC_INDIC_DIGITS = /[۰-۹]/g
const EMAIL_FORMAT_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ARABIC_TEXT_PATTERN = /[\u0600-\u06FF]/g
const ENGLISH_TEXT_PATTERN = /[A-Za-z]/g

function replaceDigit(value: string, offset: number) {
  return String(value.charCodeAt(0) - offset)
}

function removeUnsupportedCharacters(value: string) {
  return value.replace(/[^\x20-\x7E]/g, '')
}

function stripWhitespace(value: string) {
  return value.replace(/\s+/g, '')
}

function stripHttpScheme(value: string) {
  return value.replace(/^https?:\/\//i, '')
}

function hasEmbeddedScheme(value: string) {
  const normalized = value.trim().toLowerCase()
  const schemeMatch = normalized.match(/^https?:\/\//)
  const offset = schemeMatch ? schemeMatch[0].length : 0
  const remainder = normalized.slice(offset)
  return remainder.includes('http://') || remainder.includes('https://')
}

function collapseRepeatedUrlScheme(value: string) {
  const match = value.match(/^(?:https?:\/\/){2,}/i)
  if (!match) return value

  const schemes = match[0].toLowerCase()
  const lastHttpIndex = schemes.lastIndexOf('http://')
  const lastHttpsIndex = schemes.lastIndexOf('https://')
  const leadingScheme = lastHttpsIndex > lastHttpIndex ? 'https://' : 'http://'

  return `${leadingScheme}${value.slice(match[0].length)}`
}

function stripRootTrailingSlash(value: string) {
  const trimmed = value.trim()
  if (!trimmed || /[?#]/.test(trimmed)) return trimmed
  return trimmed.replace(/^(https?:\/\/[^/?#]+)\/$/i, '$1')
}

function hasMeaningfulDifference(source: string, normalized: string) {
  return source.length > 0 && source !== normalized
}

export function toLatinDigits(value: string): string {
  return value
    .replace(ARABIC_INDIC_DIGITS, (digit) => replaceDigit(digit, 0x0660))
    .replace(EASTERN_ARABIC_INDIC_DIGITS, (digit) => replaceDigit(digit, 0x06f0))
}

export function normalizeTextDigits(value: string): string {
  return toLatinDigits(value)
}

export function normalizeTextByLanguage(
  value: string,
  textLanguage: AutoConvertTextLanguage = 'any',
): string {
  const normalized = normalizeTextDigits(value)

  if (textLanguage === 'arabic') {
    return normalized.replace(ENGLISH_TEXT_PATTERN, '')
  }

  if (textLanguage === 'english') {
    return normalized.replace(ARABIC_TEXT_PATTERN, '')
  }

  return normalized
}

export function normalizeDigitsOnly(value: string): string {
  return toLatinDigits(value).replace(/\D+/g, '')
}

export function normalizeEmail(value: string): string {
  const normalized = toLatinDigits(value).trim().toLowerCase()
  return stripWhitespace(removeUnsupportedCharacters(normalized))
}

export function isValidEmailFormat(value: string): boolean {
  return EMAIL_FORMAT_PATTERN.test(value)
}

function isValidIpv4Host(host: string): boolean {
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return false
  return host.split('.').every((segment) => {
    const value = Number(segment)
    return Number.isInteger(value) && value >= 0 && value <= 255
  })
}

export function isValidUrlFormat(value: string): boolean {
  const normalized = normalizeUrl(value)
  if (!normalized) return true
  if (hasEmbeddedScheme(normalized)) return false
  const hostCandidate = stripHttpScheme(normalized).split(/[/?#]/, 1)[0] ?? ''
  if (/^\d+$/.test(hostCandidate)) return false

  let parsed: URL
  try {
    parsed = new URL(ensureHttps(normalized))
  } catch {
    return false
  }

  const host = parsed.hostname.trim().toLowerCase()
  if (!host) return false
  if (host.startsWith('.') || host.endsWith('.') || host.includes('..')) return false
  if (host === 'localhost') return true
  if (isValidIpv4Host(host)) return true

  return host.includes('.')
}

export function normalizeUrl(value: string): string {
  const normalized = toLatinDigits(value).trim()
  return collapseRepeatedUrlScheme(stripWhitespace(removeUnsupportedCharacters(normalized)))
}

export function ensureHttps(value: string): string {
  const normalized = collapseRepeatedUrlScheme(value.trim())
  if (!normalized) return ''

  if (/^https:\/\//i.test(normalized)) {
    return normalized.replace(/^https:\/\//i, HTTPS_PREFIX)
  }

  if (/^http:\/\//i.test(normalized)) {
    return normalized.replace(/^http:\/\//i, HTTPS_PREFIX)
  }

  return `${HTTPS_PREFIX}${normalized}`
}

export function normalizeUrlOnFocus(value: string): string {
  const normalized = normalizeUrl(value)
  if (!normalized) return HTTPS_PREFIX
  return normalized
}

export function normalizeUrlOnBlur(value: string): string {
  const normalized = normalizeUrl(value)
  if (!normalized) return ''

  if (/^https?:\/\/$/i.test(normalized)) {
    return ''
  }

  return stripRootTrailingSlash(ensureHttps(normalized))
}

export function getAutoConvertInvalidAttemptReason(
  mode: AutoConvertMode,
  rawValue: string,
  normalizedValue = '',
  textLanguage: AutoConvertTextLanguage = 'any',
): AutoConvertInvalidReason | null {
  const trimmedRaw = rawValue.trim()
  if (!trimmedRaw) return null

  if (mode === 'text') {
    if (textLanguage === 'any') return null

    const normalized = normalizedValue || normalizeTextByLanguage(rawValue, textLanguage)
    if (!hasMeaningfulDifference(toLatinDigits(rawValue), normalized)) return null

    return textLanguage === 'arabic' ? 'textArabicOnlyDual' : 'textEnglishOnlyDual'
  }

  if (mode === 'digits') {
    const normalized = normalizedValue || normalizeDigitsOnly(rawValue)
    return hasMeaningfulDifference(toLatinDigits(trimmedRaw), normalized) ? 'numbersOnlyDual' : null
  }

  if (mode === 'email') {
    const normalized = normalizedValue || normalizeEmail(rawValue)
    if (hasMeaningfulDifference(toLatinDigits(trimmedRaw).trim().toLowerCase(), normalized)) {
      return 'emailEnglishOnlyDual'
    }
    return isValidEmailFormat(normalized) ? null : 'emailInvalidFormatDual'
  }

  if (mode === 'url') {
    const normalized = normalizedValue || normalizeUrl(rawValue)
    const comparableRaw = stripHttpScheme(collapseRepeatedUrlScheme(toLatinDigits(trimmedRaw)))
    const comparableNormalized = stripHttpScheme(collapseRepeatedUrlScheme(normalized))
    if (hasMeaningfulDifference(
      comparableRaw,
      comparableNormalized,
    )) {
      return 'urlEnglishOnlyDual'
    }

    return isValidUrlFormat(normalized) ? null : 'urlInvalidFormatDual'
  }

  return null
}
