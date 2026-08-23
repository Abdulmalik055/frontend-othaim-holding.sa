// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import {
  COOKIE_CONSENT_COOKIE_NAME,
  CookieConsentManager,
  CookieSettingsTrigger,
  readCookieConsent,
} from "./CookieConsentManager";
import type { PublicCmsSection } from "./types";

describe("CookieConsentManager", () => {
  beforeEach(() => {
    document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=; Path=/; Max-Age=0`;
  });

  it("opens from the CMS settings label and saves selected optional categories", async () => {
    const user = userEvent.setup();
    render(
      <CookieConsentManager locale="en" section={consentSection}>
        <CookieSettingsTrigger label="Cookie Settings" />
      </CookieConsentManager>
    );

    await user.click(screen.getByRole("button", { name: "Cookie Settings" }));
    const dialog = screen.getByRole("dialog", { name: "Customise Consent Preferences" });
    expect(dialog).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Necessary" })).toHaveProperty("disabled", true);
    expect(screen.getByRole("checkbox", { name: "Functional" })).toHaveProperty("checked", false);

    await user.click(screen.getByRole("checkbox", { name: "Functional" }));
    await user.click(screen.getByRole("button", { name: "Save My Preferences" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(readCookieConsent()).toMatchObject({
      version: 1,
      necessary: true,
      functional: true,
      analytics: false,
      performance: false,
      advertisement: false,
    });
  });

  it("discards unsaved changes and supports accept-all then reject-all", async () => {
    const user = userEvent.setup();
    render(
      <CookieConsentManager locale="en" section={consentSection}>
        <CookieSettingsTrigger label="Cookie Settings" />
      </CookieConsentManager>
    );

    await user.click(screen.getByRole("button", { name: "Cookie Settings" }));
    await user.click(screen.getByRole("checkbox", { name: "Analytics" }));
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Cookie Settings" }));
    expect(screen.getByRole("checkbox", { name: "Analytics" })).toHaveProperty("checked", false);

    await user.click(screen.getByRole("button", { name: "Accept All" }));
    expect(readCookieConsent()).toMatchObject({
      functional: true,
      analytics: true,
      performance: true,
      advertisement: true,
    });

    await user.click(screen.getByRole("button", { name: "Cookie Settings" }));
    await user.click(screen.getByRole("button", { name: "Reject All" }));
    expect(readCookieConsent()).toMatchObject({
      necessary: true,
      functional: false,
      analytics: false,
      performance: false,
      advertisement: false,
    });
  });
});

const consentSection: PublicCmsSection = {
  id: "cookies-consent",
  slug: "cookies-consent-preferences",
  titleAr: "تخصيص تفضيلات الموافقة",
  titleEn: "Customise Consent Preferences",
  order: 6,
  isActive: true,
  updatedAt: "2026-08-20T00:00:00.000Z",
  content: {
    blocks: [
      {
        items: [
          text("title", "h2", "تخصيص تفضيلات الموافقة", "Customise Consent Preferences"),
          text("intro-1", "p", "مقدمة أولى", "First introduction"),
          text("intro-2", "p", "مقدمة ثانية", "Second introduction"),
          text("intro-3", "p", "مقدمة ثالثة", "Third introduction"),
          text("intro-4", "p", "مقدمة رابعة", "Fourth introduction"),
          text("necessary-title", "h3", "ضرورية", "Necessary"),
          text("necessary-status", "p", "نشطة دائمًا", "Always Active"),
          text("necessary-description", "p", "وصف الضرورية", "Necessary description"),
          text("functional-title", "h3", "وظيفية", "Functional"),
          text("functional-description", "p", "وصف الوظيفية", "Functional description"),
          text("analytics-title", "h3", "تحليلية", "Analytics"),
          text("analytics-description", "p", "وصف التحليلية", "Analytics description"),
          text("performance-title", "h3", "الأداء", "Performance"),
          text("performance-description", "p", "وصف الأداء", "Performance description"),
          text("advertisement-title", "h3", "الإعلانات", "Advertisement"),
          text("advertisement-description", "p", "وصف الإعلانات", "Advertisement description"),
          text("actions", "ul", "رفض الكل\nحفظ تفضيلاتي\nقبول الكل", "Reject All\nSave My Preferences\nAccept All"),
        ],
      },
    ],
  },
};

function text(
  key: string,
  format: "h2" | "h3" | "p" | "ul",
  textAr: string,
  textEn: string
) {
  return { key, type: "text" as const, text: { format, textAr, textEn } };
}
