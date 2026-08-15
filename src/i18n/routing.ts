import { defineRouting } from "next-intl/routing";
import { LANGUAGE_PREFERENCE_COOKIE } from "@/lib/language-utils";

export const routing = defineRouting({
  locales: ["ar", "en"],
  defaultLocale: "ar",
  localePrefix: "always",
  localeCookie: {
    name: LANGUAGE_PREFERENCE_COOKIE,
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  },
});
