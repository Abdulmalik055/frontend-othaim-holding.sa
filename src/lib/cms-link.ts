import {
  isValidEmailFormat,
  normalizeEmail,
  normalizeUrl,
  toLatinDigits,
} from "@/lib/input-auto-convert";

export const CMS_LINK_DESTINATION_TYPES = ["internal", "url", "email", "phone"] as const;

export type CmsLinkDestinationType = (typeof CMS_LINK_DESTINATION_TYPES)[number];

interface CmsPagePathInput {
  category: string;
  slug: string;
  template: string;
}

interface CmsLinkPagePathInput extends CmsPagePathInput {
  id: string;
}

const HTTP_SCHEME_PATTERN = /^https?:\/\//i;
const EMAIL_SCHEME_PATTERN = /^mailto:/i;
const PHONE_SCHEME_PATTERN = /^tel:/i;
const PHONE_VALUE_PATTERN = /^\+?\d{3,15}$/;

export function getCmsLinkDestinationType(href: string): CmsLinkDestinationType {
  if (EMAIL_SCHEME_PATTERN.test(href)) return "email";
  if (PHONE_SCHEME_PATTERN.test(href)) return "phone";
  if (HTTP_SCHEME_PATTERN.test(href)) return "url";
  return "internal";
}

export function getEmptyCmsLinkHref(type: CmsLinkDestinationType) {
  if (type === "url") return "https://";
  if (type === "email") return "mailto:";
  if (type === "phone") return "tel:";
  return "";
}

export function getCmsLinkInputValue(href: string, type: CmsLinkDestinationType) {
  if (type === "email") return href.replace(EMAIL_SCHEME_PATTERN, "");
  if (type === "phone") return href.replace(PHONE_SCHEME_PATTERN, "");
  return href;
}

export function normalizeCmsPhoneInput(value: string) {
  const normalized = toLatinDigits(value.trim());
  const prefix = normalized.startsWith("+") ? "+" : "";
  return `${prefix}${normalized.replace(/\D/g, "")}`;
}

export function composeCmsLinkHref(type: CmsLinkDestinationType, inputValue: string) {
  if (type === "email") return `mailto:${inputValue}`;
  if (type === "phone") return `tel:${normalizeCmsPhoneInput(inputValue)}`;
  if (type === "url" && !inputValue) return "https://";
  return inputValue;
}

export function normalizeCmsLinkHref(type: CmsLinkDestinationType, inputValue: string) {
  if (type === "email") return composeCmsLinkHref(type, normalizeEmail(inputValue));
  if (type === "phone") return composeCmsLinkHref(type, inputValue);
  if (type === "url") {
    const normalized = normalizeUrl(inputValue);
    if (!normalized || HTTP_SCHEME_PATTERN.test(normalized)) return normalized;
    return `https://${normalized}`;
  }
  return inputValue.trim();
}

export function getCmsPagePath(page: CmsPagePathInput) {
  if (page.template === "home" || page.slug === "home") return "/";
  return `/${page.category}/${page.slug}`;
}

export function getLocalizedCmsPagePath(page: CmsPagePathInput, locale: string) {
  const pagePath = getCmsPagePath(page);
  return pagePath === "/" ? `/${locale}` : `/${locale}${pagePath}`;
}

export function areCmsInternalHrefsAvailable(
  hrefs: string[],
  pages: CmsLinkPagePathInput[],
  currentPageId: string
) {
  const availablePaths = new Set(
    pages.filter((page) => page.id !== currentPageId).map(getCmsPagePath)
  );

  return hrefs.every(
    (href) => getCmsLinkDestinationType(href) !== "internal" || availablePaths.has(href)
  );
}

export function isSafeCmsHref(href: string) {
  const normalized = href.trim();
  if (/^\/(?!\/)[^\s]*$/.test(normalized)) return true;

  if (EMAIL_SCHEME_PATTERN.test(normalized)) {
    return isValidEmailFormat(normalized.replace(EMAIL_SCHEME_PATTERN, ""));
  }

  if (PHONE_SCHEME_PATTERN.test(normalized)) {
    return PHONE_VALUE_PATTERN.test(normalized.replace(PHONE_SCHEME_PATTERN, ""));
  }

  if (!HTTP_SCHEME_PATTERN.test(normalized)) return false;

  try {
    const url = new URL(normalized);
    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}
