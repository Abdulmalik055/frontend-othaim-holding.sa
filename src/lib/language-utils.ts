export type AppLanguage = "ar" | "en";

export const LANGUAGE_PREFERENCE_COOKIE = "othaim-global.locale";

export function normalizeLanguage(value: unknown): AppLanguage | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;

  if (normalized === "ar" || normalized.startsWith("ar-") || normalized === "arabic") return "ar";
  if (normalized === "en" || normalized.startsWith("en-") || normalized === "english") return "en";

  return null;
}

export function resolveRequestLanguage(
  cookieValue: unknown,
  acceptLanguage: string | null
): AppLanguage {
  const cookieLanguage = normalizeLanguage(cookieValue);
  if (cookieLanguage) return cookieLanguage;

  const acceptedLanguages = (acceptLanguage ?? "")
    .split(",")
    .map((entry, order) => {
      const [language, ...parameters] = entry.trim().split(";");
      const qualityParameter = parameters.find((parameter) => parameter.trim().startsWith("q="));
      const quality = qualityParameter ? Number.parseFloat(qualityParameter.trim().slice(2)) : 1;

      return {
        language: normalizeLanguage(language),
        order,
        quality: Number.isFinite(quality) ? quality : 0,
      };
    })
    .filter((entry) => entry.language && entry.quality > 0)
    .sort((left, right) => right.quality - left.quality || left.order - right.order);

  return acceptedLanguages[0]?.language ?? "ar";
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
