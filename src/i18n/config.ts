export const locales = ["ar", "en"] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "ar";

export const localeConfig = {
  ar: {
    dir: "rtl" as const,
    label: "العربية",
    dateLocale: "ar-SA",
  },
  en: {
    dir: "ltr" as const,
    label: "English",
    dateLocale: "en-US",
  },
} satisfies Record<AppLocale, { dir: "rtl" | "ltr"; label: string; dateLocale: string }>;
