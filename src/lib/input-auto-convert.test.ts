import { describe, expect, it } from 'vitest'
import {
  ensureHttps,
  getAutoConvertInvalidAttemptReason,
  normalizeDigitsOnly,
  normalizeEmail,
  normalizeUrlOnBlur,
  normalizeUrlOnFocus,
  normalizeTextDigits,
  normalizeTextByLanguage,
  normalizeUrl,
  toLatinDigits,
} from './input-auto-convert'

describe('input-auto-convert', () => {
  it('toLatinDigits converts Arabic and Persian digits to ASCII digits', () => {
    expect(toLatinDigits('٠١٢٣٤٥٦٧٨٩ ۰۱۲۳۴۵۶۷۸۹ 123')).toBe('0123456789 0123456789 123')
  })

  it('normalizeTextDigits keeps text intact while converting digits', () => {
    expect(normalizeTextDigits('مرحبا ١٢٣، جهان ۴۵')).toBe('مرحبا 123، جهان 45')
  })

  it('normalizeTextByLanguage enforces Arabic-only text when configured', () => {
    expect(normalizeTextByLanguage('شركة A١٢', 'arabic')).toBe('شركة 12')
    expect(getAutoConvertInvalidAttemptReason('text', 'شركة A١٢', '', 'arabic')).toBe(
      'textArabicOnlyDual',
    )
  })

  it('normalizeTextByLanguage enforces English-only text when configured', () => {
    expect(normalizeTextByLanguage('Company شركة١٢', 'english')).toBe('Company 12')
    expect(getAutoConvertInvalidAttemptReason('text', 'Company شركة١٢', '', 'english')).toBe(
      'textEnglishOnlyDual',
    )
  })

  it('text language validation accepts whitespace without reporting a language error', () => {
    expect(getAutoConvertInvalidAttemptReason('text', ' شركة ', '', 'arabic')).toBeNull()
    expect(getAutoConvertInvalidAttemptReason('text', ' Company ', '', 'english')).toBeNull()
  })

  it('normalizeDigitsOnly strips non-digits, including e + - and .', () => {
    expect(normalizeDigitsOnly('١٢e+-.٣abc٤٥')).toBe('12345')
    expect(getAutoConvertInvalidAttemptReason('digits', '١٢e+-.٣abc٤٥')).toBe('numbersOnlyDual')
  })

  it('normalizeDigitsOnly leaves clean digit input alone', () => {
    expect(normalizeDigitsOnly('7001234567')).toBe('7001234567')
    expect(getAutoConvertInvalidAttemptReason('digits', '7001234567')).toBeNull()
  })

  it('normalizeEmail converts digits and keeps the value english-only', () => {
    expect(normalizeEmail('User١٢٣@Example.COM')).toBe('user123@example.com')
    expect(getAutoConvertInvalidAttemptReason('email', 'User١٢٣@Example.COM')).toBeNull()
  })

  it('normalizeEmail reports an invalid attempt for non-English characters', () => {
    expect(normalizeEmail('مستخدم@example.com')).toBe('@example.com')
    expect(getAutoConvertInvalidAttemptReason('email', 'مستخدم@example.com')).toBe(
      'emailEnglishOnlyDual',
    )
  })

  it('normalizeEmail reports an invalid attempt for invalid email format', () => {
    expect(normalizeEmail('userexample.com')).toBe('userexample.com')
    expect(getAutoConvertInvalidAttemptReason('email', 'userexample.com')).toBe(
      'emailInvalidFormatDual',
    )
  })

  it('normalizeUrl converts digits and keeps the value english-only', () => {
    expect(normalizeUrl('https://example.com/path/١٢?ref=٣')).toBe('https://example.com/path/12?ref=3')
    expect(getAutoConvertInvalidAttemptReason('url', 'https://example.com/path/١٢?ref=٣')).toBeNull()
  })

  it('normalizeUrl collapses duplicated schemes caused by paste over prefixed value', () => {
    expect(normalizeUrl('https://https://chatgpt.com')).toBe('https://chatgpt.com')
    expect(normalizeUrl('https://http://chatgpt.com')).toBe('http://chatgpt.com')
    expect(getAutoConvertInvalidAttemptReason('url', 'https://https://chatgpt.com')).toBeNull()
  })

  it('normalizeUrl reports an invalid attempt for non-English characters', () => {
    expect(normalizeUrl('https://مثال.com/path')).toBe('https://.com/path')
    expect(getAutoConvertInvalidAttemptReason('url', 'https://مثال.com/path')).toBe('urlEnglishOnlyDual')
  })

  it('normalizeUrl reports an invalid attempt for invalid URL format', () => {
    expect(getAutoConvertInvalidAttemptReason('url', 'https://testffff')).toBe('urlInvalidFormatDual')
    expect(getAutoConvertInvalidAttemptReason('url', 'testffff')).toBe('urlInvalidFormatDual')
    expect(getAutoConvertInvalidAttemptReason('url', '1234')).toBe('urlInvalidFormatDual')
    expect(getAutoConvertInvalidAttemptReason('url', 'https://gg.hhttps://gg.h')).toBe('urlInvalidFormatDual')
    expect(getAutoConvertInvalidAttemptReason('url', 'chatgpt.com')).toBeNull()
  })

  it('ensureHttps adds https to bare domains and upgrades http to https', () => {
    expect(ensureHttps('example.com/path')).toBe('https://example.com/path')
    expect(ensureHttps('http://example.com/path')).toBe('https://example.com/path')
    expect(ensureHttps('https://example.com/path')).toBe('https://example.com/path')
    expect(ensureHttps('https://https://example.com/path')).toBe('https://example.com/path')
    expect(ensureHttps('  example.com/path  ')).toBe('https://example.com/path')
    expect(ensureHttps('   ')).toBe('')
  })

  it('normalizeUrlOnFocus inserts https:// when value is empty', () => {
    expect(normalizeUrlOnFocus('')).toBe('https://')
    expect(normalizeUrlOnFocus('   ')).toBe('https://')
  })

  it('normalizeUrlOnFocus keeps existing non-empty value', () => {
    expect(normalizeUrlOnFocus('example.com')).toBe('example.com')
    expect(normalizeUrlOnFocus('https://example.com')).toBe('https://example.com')
  })

  it('normalizeUrlOnBlur clears protocol-only value and ensures https otherwise', () => {
    expect(normalizeUrlOnBlur('https://')).toBe('')
    expect(normalizeUrlOnBlur('http://')).toBe('')
    expect(normalizeUrlOnBlur('https://https://chatgpt.com')).toBe('https://chatgpt.com')
    expect(normalizeUrlOnBlur('example.com')).toBe('https://example.com')
    expect(normalizeUrlOnBlur('http://example.com')).toBe('https://example.com')
  })

  it('normalizeUrlOnBlur removes trailing slash only for root URLs', () => {
    expect(normalizeUrlOnBlur('https://web.whatsapp.com/')).toBe('https://web.whatsapp.com')
    expect(normalizeUrlOnBlur('https://web.whatsapp.com/path/')).toBe('https://web.whatsapp.com/path/')
    expect(normalizeUrlOnBlur('1234')).toBe('https://1234')
  })
})
