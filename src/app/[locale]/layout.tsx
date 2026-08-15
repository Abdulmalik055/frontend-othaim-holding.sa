import type { Metadata } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { AppLocale } from "@/i18n/config";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { getPublicPlatformSettings } from "@/features/public/cms/api";
import "@/app/globals.css";

const inter = localFont({
  src: [
    { path: "../../assets/fonts/Inter-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../assets/fonts/Inter-Medium.ttf", weight: "500", style: "normal" },
    { path: "../../assets/fonts/Inter-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../../assets/fonts/Inter-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
});

const dmSans = localFont({
  src: "../../assets/fonts/DMSans-Variable.ttf",
  variable: "--font-dm-sans",
  weight: "100 1000",
  display: "swap",
});

const cairo = localFont({
  src: "../../assets/fonts/Cairo-Variable.ttf",
  variable: "--font-cairo",
  weight: "200 1000",
  display: "swap",
});

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
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!),
    ...(localizedName
      ? {
          title: {
            default: localizedName,
            template: `%s | ${localizedName}`,
          },
        }
      : {}),
    description: localizedBio || undefined,
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
      <body
        className={`${inter.variable} ${dmSans.variable} ${cairo.variable} min-h-full antialiased`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
