import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { AppLocale } from "@/i18n/config";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { getPublicPlatformSettings } from "@/features/public/cms/api";
import "@/app/globals.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const settings = await getPublicPlatformSettings().catch(() => null);
  const localizedName =
    (locale === "ar" ? settings?.nameAr : settings?.nameEn)?.trim() ||
    (locale === "ar" ? settings?.nameEn : settings?.nameAr)?.trim();
  const localizedBio =
    (locale === "ar" ? settings?.bioAr : settings?.bioEn)?.trim() ||
    (locale === "ar" ? settings?.bioEn : settings?.bioAr)?.trim();
  const logoUrl = settings?.logoUrl?.trim();

  return {
    ...(localizedName
      ? {
          title: {
            default: localizedName,
            template: `%s | ${localizedName}`,
          },
        }
      : {}),
    description: localizedBio || undefined,
    icons: logoUrl ? { icon: logoUrl, shortcut: logoUrl, apple: logoUrl } : undefined,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const normalizedLocale = locale.trim().toLowerCase();

  if (!routing.locales.includes(normalizedLocale as AppLocale)) {
    notFound();
  }

  const messages = await getMessages({ locale: normalizedLocale });

  return (
    <html
      lang={normalizedLocale}
      dir={normalizedLocale === "ar" ? "rtl" : "ltr"}
      className="h-full"
    >
      <body className="min-h-full antialiased" suppressHydrationWarning>
        <QueryProvider>
          <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
