// @vitest-environment happy-dom

import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CmsLinkPage } from "@/features/admin/cms/hooks/useCmsPages";
import type { CmsSectionItem } from "@/features/admin/cms/schemas/cms-section.schema";
import { CmsButtonItemFields } from "./CmsButtonItemFields";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

type LinkValue = Extract<CmsSectionItem, { type: "link" }>["link"];

const pages: CmsLinkPage[] = [
  {
    id: "home-page",
    category: "info",
    template: "home",
    slug: "home",
    titleAr: "الرئيسية",
    titleEn: "Home",
  },
  {
    id: "about-page",
    category: "info",
    template: "about",
    slug: "about",
    titleAr: "من نحن",
    titleEn: "About Us",
  },
  {
    id: "privacy-page",
    category: "legal",
    template: "default",
    slug: "privacy",
    titleAr: "الخصوصية",
    titleEn: "Privacy",
  },
];

function ButtonFieldsHarness({
  initialLink,
  pageId = "current-page",
  availablePages = pages,
  isPagesLoading = false,
  isPagesError = false,
  onRetryPages = vi.fn(),
}: {
  initialLink: LinkValue;
  pageId?: string;
  availablePages?: CmsLinkPage[];
  isPagesLoading?: boolean;
  isPagesError?: boolean;
  onRetryPages?: () => void;
}) {
  const [link, setLink] = useState(initialLink);

  return (
    <>
      <CmsButtonItemFields
        pageId={pageId}
        link={link}
        pages={availablePages}
        isPagesLoading={isPagesLoading}
        isPagesError={isPagesError}
        onRetryPages={onRetryPages}
        onChange={setLink}
        autoConvertMessages={{}}
      />
      <output aria-label="stored href">{link.href}</output>
    </>
  );
}

const baseLink: LinkValue = {
  labelAr: "تواصل",
  labelEn: "Contact",
  href: "",
  style: "primary",
};

describe("CmsButtonItemFields", () => {
  it("stacks on small screens and gives the destination more desktop space", () => {
    render(<ButtonFieldsHarness initialLink={baseLink} />);

    expect(screen.getByText("linkType").parentElement?.parentElement?.className).toContain(
      "sm:grid-cols-[minmax(150px,0.36fr)_minmax(0,1fr)]"
    );
  });

  it("edits an email without requiring the mailto prefix", async () => {
    const user = userEvent.setup();
    render(<ButtonFieldsHarness initialLink={{ ...baseLink, href: "mailto:hello@example.com" }} />);

    const email = screen.getByRole("textbox", { name: /linkHref/ }) as HTMLInputElement;
    expect(email.type).toBe("email");
    expect(email.value).toBe("hello@example.com");
    expect(screen.getByText("mailto:")).toBeDefined();

    await user.clear(email);
    await user.type(email, "team@example.com");

    expect(screen.getByLabelText("stored href").textContent).toBe("mailto:team@example.com");
  });

  it("clears the destination and changes to a canonical phone editor", async () => {
    const user = userEvent.setup();
    render(<ButtonFieldsHarness initialLink={{ ...baseLink, href: "https://example.com" }} />);

    await user.click(screen.getByLabelText("linkType"));
    await user.click(screen.getByText("linkTypePhone"));

    const phone = screen.getByRole("textbox", { name: /linkHref/ }) as HTMLInputElement;
    expect(phone.type).toBe("tel");
    expect(phone.value).toBe("");
    expect(
      screen.getAllByText("tel:").some((element) => element.getAttribute("translate") === "no")
    ).toBe(true);
    expect(screen.getByLabelText("stored href").textContent).toBe("tel:");

    await user.type(phone, "+٩٦٧ (١٢٣) ٤٥٦-٧٨٩");
    expect(screen.getByLabelText("stored href").textContent).toBe("tel:+967123456789");
  });

  it("lists active pages except the current page and stores a locale-neutral path", async () => {
    const user = userEvent.setup();
    render(<ButtonFieldsHarness pageId="home-page" initialLink={{ ...baseLink, href: "" }} />);

    const comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[1]);

    expect(screen.queryByRole("option", { name: /Home.*الرئيسية.*\/$/ })).toBeNull();
    expect(screen.getByRole("option", { name: /About Us.*من نحن.*\/info\/about/ })).toBeDefined();
    expect(
      screen.getByRole("option", { name: /Privacy.*الخصوصية.*\/legal\/privacy/ })
    ).toBeDefined();

    await user.type(comboboxes[1], "من نحن");
    expect(screen.getByRole("option", { name: /About Us.*من نحن.*\/info\/about/ })).toBeDefined();
    expect(
      screen.queryByRole("option", { name: /Privacy.*الخصوصية.*\/legal\/privacy/ })
    ).toBeNull();

    await user.click(screen.getByRole("option", { name: /About Us.*\/info\/about/ }));
    expect(screen.getByLabelText("stored href").textContent).toBe("/info/about");
  });

  it("groups internal pages by localized category with a count for each group", async () => {
    const user = userEvent.setup();
    render(<ButtonFieldsHarness initialLink={baseLink} />);

    await user.click(screen.getAllByRole("combobox")[1]);

    const legalHeading = screen.getByText("categoryLegal").parentElement;
    const infoHeading = screen.getByText("categoryInfo").parentElement;

    expect(legalHeading?.textContent).toBe("categoryLegal1");
    expect(infoHeading?.textContent).toBe("categoryInfo2");
    expect(screen.getByText("Privacy")).toBeDefined();
    expect(screen.getByText("الخصوصية")).toBeDefined();
    expect(screen.getByText("About Us")).toBeDefined();
    expect(screen.getByText("من نحن")).toBeDefined();
    expect(screen.getByText("/info/about")).toBeDefined();
    expect(screen.getByText("/legal/privacy").getAttribute("dir")).toBe("ltr");
  });

  it("shows an existing unavailable path without silently clearing it", () => {
    render(<ButtonFieldsHarness initialLink={{ ...baseLink, href: "/info/missing" }} />);

    const error = screen.getByText("linkUnavailable");
    expect(error).toBeDefined();
    expect(error.closest('[aria-live="polite"]')).not.toBeNull();
    expect(screen.getAllByText(/\/info\/missing/).length).toBeGreaterThan(0);
    expect(screen.getByLabelText("stored href").textContent).toBe("/info/missing");
  });

  it("shows localized loading, empty, and fetch-error states with retry", async () => {
    const user = userEvent.setup();
    const onRetryPages = vi.fn();
    const { rerender } = render(
      <ButtonFieldsHarness initialLink={baseLink} isPagesLoading availablePages={[]} />
    );

    expect(screen.getByText("linkLoadingPages")).toBeDefined();

    rerender(<ButtonFieldsHarness initialLink={baseLink} availablePages={[]} />);
    await user.click(screen.getAllByRole("combobox")[1]);
    expect(screen.getByText("linkNoPages")).toBeDefined();

    rerender(
      <ButtonFieldsHarness
        initialLink={baseLink}
        availablePages={[]}
        isPagesError
        onRetryPages={onRetryPages}
      />
    );
    expect(screen.getByText("linkPagesError")).toBeDefined();
    await user.click(screen.getByRole("button", { name: "linkRetryPages" }));
    expect(onRetryPages).toHaveBeenCalledOnce();
  });
});
