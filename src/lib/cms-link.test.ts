import { describe, expect, it } from "vitest";
import {
  areCmsInternalHrefsAvailable,
  composeCmsLinkHref,
  getCmsLinkDestinationType,
  getCmsLinkInputValue,
  getLocalizedCmsPagePath,
  getCmsPagePath,
  getEmptyCmsLinkHref,
  isSafeCmsHref,
  normalizeCmsLinkHref,
} from "@/lib/cms-link";

describe("CMS link destinations", () => {
  it("derives the editor type from the persisted href", () => {
    expect(getCmsLinkDestinationType("/info/about")).toBe("internal");
    expect(getCmsLinkDestinationType("https://example.com")).toBe("url");
    expect(getCmsLinkDestinationType("http://example.com")).toBe("url");
    expect(getCmsLinkDestinationType("mailto:hello@example.com")).toBe("email");
    expect(getCmsLinkDestinationType("tel:+967123456789")).toBe("phone");
  });

  it("uses invalid prefix-only hrefs to preserve a newly selected editor type", () => {
    expect(getEmptyCmsLinkHref("internal")).toBe("");
    expect(getEmptyCmsLinkHref("url")).toBe("https://");
    expect(getEmptyCmsLinkHref("email")).toBe("mailto:");
    expect(getEmptyCmsLinkHref("phone")).toBe("tel:");
  });

  it("hides generated email and phone schemes from the editable value", () => {
    expect(getCmsLinkInputValue("mailto:hello@example.com", "email")).toBe("hello@example.com");
    expect(getCmsLinkInputValue("tel:+967123456789", "phone")).toBe("+967123456789");
    expect(getCmsLinkInputValue("https://example.com", "url")).toBe("https://example.com");
  });

  it("composes generated schemes without changing an in-progress URL", () => {
    expect(composeCmsLinkHref("email", "hello@example.com")).toBe("mailto:hello@example.com");
    expect(composeCmsLinkHref("phone", "+967 123-456")).toBe("tel:+967123456");
    expect(composeCmsLinkHref("url", "example")).toBe("example");
    expect(composeCmsLinkHref("url", "")).toBe("https://");
  });

  it("normalizes complete destination values on blur", () => {
    expect(normalizeCmsLinkHref("url", "example.com/path")).toBe("https://example.com/path");
    expect(normalizeCmsLinkHref("url", "http://example.com")).toBe("http://example.com");
    expect(normalizeCmsLinkHref("email", "User@Example.COM")).toBe("mailto:user@example.com");
    expect(normalizeCmsLinkHref("phone", "+٩٦٧ (١٢٣) ٤٥٦-٧٨٩")).toBe("tel:+967123456789");
  });

  it("builds locale-neutral public paths for selectable CMS pages", () => {
    expect(getCmsPagePath({ category: "info", slug: "home", template: "home" })).toBe("/");
    expect(getCmsPagePath({ category: "legal", slug: "privacy", template: "default" })).toBe(
      "/legal/privacy"
    );
  });

  it("localizes public CMS paths with the homepage at the locale root", () => {
    expect(
      getLocalizedCmsPagePath({ category: "info", slug: "landing", template: "home" }, "ar")
    ).toBe("/ar");
    expect(
      getLocalizedCmsPagePath({ category: "legal", slug: "privacy", template: "default" }, "en")
    ).toBe("/en/legal/privacy");
  });

  it("accepts only complete safe destinations", () => {
    expect(isSafeCmsHref("/info/about")).toBe(true);
    expect(isSafeCmsHref("https://example.com/path")).toBe(true);
    expect(isSafeCmsHref("http://localhost:3000/path")).toBe(true);
    expect(isSafeCmsHref("mailto:hello@example.com")).toBe(true);
    expect(isSafeCmsHref("tel:+967123456789")).toBe(true);

    expect(isSafeCmsHref("/")).toBe(true);
    expect(isSafeCmsHref("https://")).toBe(false);
    expect(isSafeCmsHref("mailto:")).toBe(false);
    expect(isSafeCmsHref("mailto:not-an-email")).toBe(false);
    expect(isSafeCmsHref("tel:")).toBe(false);
    expect(isSafeCmsHref("tel:+12")).toBe(false);
    expect(isSafeCmsHref("//example.com")).toBe(false);
    expect(isSafeCmsHref("javascript:alert(1)")).toBe(false);
  });

  it("requires internal destinations to resolve to an active page other than the current page", () => {
    const pages = [
      { id: "home", category: "info", slug: "home", template: "home" },
      { id: "about", category: "info", slug: "about", template: "about" },
    ];

    expect(
      areCmsInternalHrefsAvailable(["/info/about", "mailto:hello@example.com"], pages, "home")
    ).toBe(true);
    expect(areCmsInternalHrefsAvailable(["/"], pages, "home")).toBe(false);
    expect(areCmsInternalHrefsAvailable(["/info/missing"], pages, "home")).toBe(false);
  });
});
