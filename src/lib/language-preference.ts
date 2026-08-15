import { LANGUAGE_PREFERENCE_COOKIE, type AppLanguage } from './language-utils'

export { resolvePreferredLanguageFromUser, normalizeLanguage, LANGUAGE_PREFERENCE_COOKIE, type AppLanguage } from './language-utils'

export function setLanguagePreferenceCookie(lang: AppLanguage) {
  if (typeof document === 'undefined') return
  document.cookie = `${LANGUAGE_PREFERENCE_COOKIE}=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`
}

export async function persistLanguagePreference(lang: AppLanguage) {
  setLanguagePreferenceCookie(lang)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 1500)

  try {
    await fetch('/api/auth/language', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      keepalive: true,
      signal: controller.signal,
      body: JSON.stringify({ lang }),
    })
  } catch {
    // Locale switch should still continue even if preference sync fails.
  } finally {
    clearTimeout(timeoutId)
  }
}
