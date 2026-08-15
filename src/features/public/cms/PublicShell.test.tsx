import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PublicShell } from "@/features/public/cms/PublicShell";

const apiMocks = vi.hoisted(() => ({
  getPublicCmsNavigation: vi.fn(),
  getPublicPlatformSettings: vi.fn(),
}));

vi.mock("@/features/public/cms/api", () => apiMocks);

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));

vi.mock("next/image", () => ({
  default: ({ src, alt, className }: { src: string; alt: string; className?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element -- test double captures resolved branding.
    <img src={src} alt={alt} className={className} />
  ),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/features/public/cms/PublicHeader", () => ({
  PublicHeader: ({
    logoUrl,
    navigation,
  }: {
    logoUrl: string;
    navigation: { business: Array<{ slug: string; label: string }> };
  }) => (
    <div
      data-testid="public-header"
      data-logo={logoUrl}
      data-contact={navigation.business.find((item) => item.slug === "contact")?.label}
    />
  ),
}));

vi.mock("@/features/public/cms/OthaimMotionEnhancer", () => ({
  OthaimMotionEnhancer: () => null,
}));

const contactSummary = {
  id: "contact",
  slug: "contact",
  titleAr: "تواصل",
  titleEn: "Contact title",
  category: "info" as const,
  template: "default" as const,
  navigationPlacement: "both" as const,
  navigationOrder: 8,
  isIndexable: true,
  updatedAt: "2026-08-15T00:00:00.000Z",
  headerNavigationLabelAr: "تواصل",
  headerNavigationLabelEn: "Contacts",
  footerNavigationLabelAr: "تواصل",
  footerNavigationLabelEn: "Contact",
};

describe("PublicShell branding", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://othaimglobal.example";
    apiMocks.getPublicCmsNavigation.mockResolvedValue([contactSummary]);
    apiMocks.getPublicPlatformSettings.mockResolvedValue({
      nameAr: "العثيم جلوبال",
      nameEn: "Client-owned Othaim",
      logoUrl: "/uploads/client-logo.svg",
      socialLinks: { holding: "https://holding.example/group" },
    });
  });

  it("uses the platform logo in header, footer, and Organization JSON-LD", async () => {
    const html = renderToStaticMarkup(
      await PublicShell({ locale: "en", children: <main>Page</main> })
    );

    expect(html).toContain('data-logo="/uploads/client-logo.svg"');
    expect(html).toContain('src="/uploads/client-logo.svg"');
    expect(html).toContain('"logo":"https://othaimglobal.example/uploads/client-logo.svg"');
    expect(html).toContain('data-contact="Contacts"');
    expect(html).toContain(">Contact</a>");
    expect(html).not.toContain(">Contact title</a>");
    expect(html).toContain('href="https://holding.example/group"');
    expect(html).toContain(
      '"parentOrganization":{"@type":"Organization","name":"Al Othaim Holding","url":"https://holding.example/group"}'
    );
    expect(html).toContain('"alternateName":["العثيم جلوبال"]');
    expect(html).not.toContain('"sameAs":["https://holding.example/group"]');
  });

  it("falls back to the trusted static logo when settings omit one", async () => {
    apiMocks.getPublicPlatformSettings.mockResolvedValue({ nameEn: "Othaim Global" });

    const html = renderToStaticMarkup(
      await PublicShell({ locale: "en", children: <main>Page</main> })
    );

    expect(html).toContain('data-logo="/branding/logo-dark.svg"');
    expect(html).toContain('src="/branding/logo-dark.svg"');
  });
});
