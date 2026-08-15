// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleSwitch } from "@/features/public/cms/LocaleSwitch";

const replace = vi.fn();

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => (key === "languageEnglish" ? "English" : "العربية"),
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/about",
  useRouter: () => ({ replace }),
}));

describe("LocaleSwitch", () => {
  beforeEach(() => {
    replace.mockClear();
    document.cookie = "othaim-global.locale=; Max-Age=0; Path=/";
  });

  it("preserves the current route and persists the requested locale", () => {
    render(<LocaleSwitch locale="ar" />);

    fireEvent.click(screen.getByRole("button", { name: "English" }));

    expect(replace).toHaveBeenCalledWith("/about", { locale: "en", scroll: false });
    expect(document.cookie).toContain("othaim-global.locale=en");
  });
});
