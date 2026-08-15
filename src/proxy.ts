import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import {
  buildLocalizedPath,
  LANGUAGE_PREFERENCE_COOKIE,
  normalizeLanguage,
  resolveRequestLanguage,
} from "@/lib/language-utils";
import { SESSION_COOKIE_NAMES } from "@/lib/session-cookies";

const intlMiddleware = createMiddleware(routing);

const protectedRoutes = ["/admin"];
const PUBLIC_PAGE_SLUGS = "about|family|founder|committee|team|portfolio|strategy|contact";
const CMS_SLUG_PATTERN = "[a-z0-9]+(?:-[a-z0-9]+)*";
const RESERVED_INFO_ROUTE_SLUGS = new Set(["admin", "api", "auth", "legal"]);

function parseLocaleAndPath(pathname: string): { locale: string; path: string } {
  const first = pathname.split("/").filter(Boolean)[0];
  const locale = first === "ar" || first === "en" ? first : "ar";
  const path = pathname.replace(/^\/(ar|en)/, "") || "/";
  return { locale, path };
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { locale, path } = parseLocaleAndPath(pathname);

  // Ignore browser/devtools probing paths to avoid unnecessary middleware work.
  if (path.startsWith("/.well-known/")) {
    return NextResponse.next();
  }

  // Next metadata files are global routes and must never enter locale routing.
  if (pathname === "/robots.txt" || pathname === "/sitemap.xml") {
    return NextResponse.next();
  }

  const sessionToken = SESSION_COOKIE_NAMES.map((name) => request.cookies.get(name)?.value).find(
    Boolean
  );

  const isAuthenticated = !!sessionToken;
  const isAuthLoginRoute = path === "/auth/login";
  const preferredLocale = normalizeLanguage(request.cookies.get(LANGUAGE_PREFERENCE_COOKIE)?.value);
  const acceptHeader = request.headers.get("accept") ?? "";
  const isDocumentRequest =
    request.method === "GET" &&
    (request.headers.get("sec-fetch-dest") === "document" || acceptHeader.includes("text/html"));

  if (isDocumentRequest) {
    const legacyHtmlMatch = pathname.match(
      new RegExp(`^/(ar|en)/(index|${PUBLIC_PAGE_SLUGS})\\.html/?$`)
    );
    const legacyInfoCandidate = pathname.match(
      new RegExp(`^/(ar|en)/info/(home|${CMS_SLUG_PATTERN})/?$`)
    );
    const legacyInfoMatch =
      legacyInfoCandidate && !RESERVED_INFO_ROUTE_SLUGS.has(legacyInfoCandidate[2])
        ? legacyInfoCandidate
        : null;

    if (legacyHtmlMatch || legacyInfoMatch) {
      const [, legacyLocale, legacySlug] = legacyHtmlMatch ?? legacyInfoMatch ?? [];
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname =
        legacySlug === "index" || legacySlug === "home"
          ? `/${legacyLocale}`
          : `/${legacyLocale}/${legacySlug}`;
      return NextResponse.redirect(redirectUrl, 308);
    }

    if (!/^\/(ar|en)(?=\/|$)/.test(pathname)) {
      const requestLocale = resolveRequestLanguage(
        request.cookies.get(LANGUAGE_PREFERENCE_COOKIE)?.value,
        request.headers.get("accept-language")
      );
      const redirectUrl = request.nextUrl.clone();
      const unlocalizedInfoCandidate = pathname.match(
        new RegExp(`^/info/(home|${CMS_SLUG_PATTERN})/?$`)
      );
      const unlocalizedInfoMatch =
        unlocalizedInfoCandidate && !RESERVED_INFO_ROUTE_SLUGS.has(unlocalizedInfoCandidate[1])
          ? unlocalizedInfoCandidate
          : null;
      const requestedPath = unlocalizedInfoMatch
        ? unlocalizedInfoMatch[1] === "home"
          ? "/"
          : `/${unlocalizedInfoMatch[1]}`
        : pathname === "/index.html"
          ? "/"
          : pathname;
      redirectUrl.pathname = buildLocalizedPath(requestedPath, requestLocale);
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (isAuthenticated && isAuthLoginRoute) {
    return NextResponse.redirect(new URL(`/${locale}/admin/dashboard`, request.url));
  }

  if (isDocumentRequest && isAuthenticated && preferredLocale && preferredLocale !== locale) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = buildLocalizedPath(pathname, preferredLocale);
    return NextResponse.redirect(redirectUrl);
  }

  if (protectedRoutes.some((route) => path.startsWith(route)) && !isAuthenticated) {
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url));
  }

  return intlMiddleware(request) ?? NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|api|uploads|[^?]*\\.(?:css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|pdf|txt|xml|webmanifest)).*)",
  ],
};
