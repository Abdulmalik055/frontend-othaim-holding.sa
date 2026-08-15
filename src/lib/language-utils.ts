export type AppLanguage = "ar" | "en";

export const LANGUAGE_PREFERENCE_COOKIE = "cms-core.lang";

export function normalizeLanguage(value: unknown): AppLanguage | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;

  if (normalized === "ar" || normalized.startsWith("ar-") || normalized === "arabic") return "ar";
  if (normalized === "en" || normalized.startsWith("en-") || normalized === "english") return "en";

  return null;
}

export function resolvePreferredLanguageFromUser(
  user: unknown,
  fallback: AppLanguage
): AppLanguage {
  if (!user || typeof user !== "object") return fallback;

  const candidate = user as Record<string, unknown>;
  const preferences =
    candidate.preferences && typeof candidate.preferences === "object"
      ? (candidate.preferences as Record<string, unknown>)
      : null;

  return (
    normalizeLanguage(candidate.lang) ??
    normalizeLanguage(candidate.language) ??
    normalizeLanguage(candidate.preferredLanguage) ??
    normalizeLanguage(candidate.locale) ??
    normalizeLanguage(preferences?.language) ??
    fallback
  );
}

export function buildLocalizedPath(pathname: string, target: AppLanguage): string {
  if (/^\/(ar|en)(?=\/|$)/.test(pathname)) {
    return pathname.replace(/^\/(ar|en)(?=\/|$)/, `/${target}`);
  }

  const normalizedPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return normalizedPathname === "/" ? `/${target}` : `/${target}${normalizedPathname}`;
}
