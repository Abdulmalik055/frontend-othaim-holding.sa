import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as "ar" | "en")) {
    locale = routing.defaultLocale;
  }

  const [common, auth, admin] = await Promise.all([
    import(`./messages/${locale}/common.json`),
    import(`./messages/${locale}/auth.json`),
    import(`./messages/${locale}/admin.json`),
  ]);

  return {
    locale,
    messages: {
      ...common.default,
      ...auth.default,
      ...admin.default,
    },
  };
});
