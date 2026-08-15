// @vitest-environment happy-dom

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LocalizedNotFound from "@/app/[locale]/not-found";
import { PublicLoading } from "@/features/public/cms/PublicLoading";
import { PublicUnavailable } from "@/features/public/cms/PublicUnavailable";

vi.mock("next/image", () => ({
  default: (props: { alt: string }) => <span role="img" aria-label={props.alt} />,
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
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
}));

describe("branded public states", () => {
  it("renders a teal Othaim loading status with visible accessible copy", () => {
    const { container } = render(<PublicLoading />);
    const status = screen.getByRole("status", { name: "loadingContent" });

    expect(status.className).toContain("ogc-state");
    expect(container.querySelector(".ogc-loader")).toBeTruthy();
    expect(screen.getByText("loadingContent")).toBeTruthy();
  });

  it("renders the branded 404 with a localized home route", () => {
    render(<LocalizedNotFound />);

    expect(screen.getByRole("heading", { name: "notFoundTitle" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Othaim Global" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "backHome" }).getAttribute("href")).toBe("/");
  });

  it("renders unavailable content in the branded accessible state", () => {
    render(<PublicUnavailable title="Temporarily unavailable" message="Please try again." />);

    const main = screen.getByRole("main", { name: "Temporarily unavailable" });
    expect(main.className).toContain("ogc-public-error");
    expect(screen.getByText("Please try again.")).toBeTruthy();
  });
});
