// @vitest-environment happy-dom

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PublicHeader } from "@/features/public/cms/PublicHeader";

vi.mock("next/image", () => ({
  default: (props: { alt: string }) => <span role="img" aria-label={props.alt} />,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    locale,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    children: ReactNode;
    locale?: string;
  }) => (
    <a {...props} data-locale={locale}>
      {children}
    </a>
  ),
  usePathname: () => "/about",
  useRouter: () => ({ replace: vi.fn() }),
}));

const navigation = {
  whoWeAre: [
    { id: "about", slug: "about", label: "About CMS", href: "/about" },
    { id: "family", slug: "family", label: "Family CMS", href: "/family" },
  ],
  management: [{ id: "founder", slug: "founder", label: "Founder CMS", href: "/founder" }],
  business: [{ id: "contact", slug: "contact", label: "Contact CMS", href: "/contact" }],
};

const labels = {
  home: "Home",
  mainNavigation: "Main navigation",
  menu: "Menu",
  closeMenu: "Close menu",
  whoWeAre: "Who we are",
  management: "Management",
};

describe("PublicHeader keyboard and drawer behavior", () => {
  it("closes a dropdown with Escape and restores its trigger focus", async () => {
    const user = userEvent.setup();
    render(<PublicHeader locale="en" navigation={navigation} labels={labels} />);
    const trigger = screen.getByRole("button", { name: /Who we are/ });

    await user.click(trigger);
    const familyLink = screen.getByRole("link", { name: "Family CMS" });
    familyLink.focus();
    fireEvent.keyDown(document, { key: "Escape" });

    expect(document.activeElement).toBe(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes the mobile drawer on an outside pointer event", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <PublicHeader locale="en" navigation={navigation} labels={labels} />
    );
    const menuButton = screen.getByRole("button", { name: "Menu" });

    await user.click(menuButton);
    expect(menuButton.getAttribute("aria-expanded")).toBe("true");
    fireEvent.pointerDown(document.body);

    expect(menuButton.getAttribute("aria-expanded")).toBe("false");
    expect(container.querySelector<HTMLDivElement>("#ogc-mobile-navigation")?.hidden).toBe(true);
  });
});
