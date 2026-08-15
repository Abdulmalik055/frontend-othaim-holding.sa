// @vitest-environment happy-dom

import { StrictMode, type ReactElement } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CmsPage } from "@/features/admin/cms/hooks/useCmsPages";
import { ApiError } from "@/lib/api-client";
import { CmsPageDialog } from "./CmsPageDialog";

const testState = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  upload: vi.fn(),
  removeMedia: vi.fn(),
  mediaAssets: [] as Array<Record<string, unknown>>,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/lib/api-client", () => ({
  ApiError: class ApiError extends Error {
    constructor(
      public status: number,
      message: string,
      public data?: unknown
    ) {
      super(message);
    }
  },
}));

vi.mock("@/features/admin/cms/hooks/useUnsavedChanges", () => ({
  useUnsavedChanges: vi.fn(),
}));

vi.mock("@/features/admin/cms/hooks/useCmsPageMutate", () => ({
  useCmsPageCreate: () => ({ mutate: testState.create, isPending: false }),
  useCmsPageUpdate: () => ({ mutate: testState.update, isPending: false }),
  useCmsPageDelete: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/features/admin/cms/hooks/useCmsSectionMutate", () => ({
  useAdminMediaAssets: () => ({
    data: { data: testState.mediaAssets },
    refetch: vi.fn().mockResolvedValue(undefined),
  }),
  useAdminMediaUpload: () => ({ mutateAsync: testState.upload, isPending: false }),
  useAdminMediaDelete: () => ({ mutateAsync: testState.removeMedia, isPending: false }),
}));

function renderCreateDialog(): ReactElement {
  return <CmsPageDialog mode="create" onClose={vi.fn()} />;
}

const homepage = {
  id: "homepage-id",
  slug: "home",
  titleAr: "الرئيسية",
  titleEn: "Home",
  category: "info",
  template: "home",
  isIndexable: true,
  isActive: true,
} as CmsPage;

const regularPage = {
  ...homepage,
  id: "about-id",
  slug: "about-us",
  titleAr: "من نحن",
  titleEn: "About us",
  template: "default",
} as CmsPage;

describe("CmsPageDialog homepage behavior", () => {
  beforeEach(() => {
    testState.create.mockReset();
    testState.update.mockReset();
    testState.upload.mockReset();
    testState.removeMedia.mockReset();
    testState.mediaAssets = [];
  });

  it("uses one editor upload token for an SEO upload and the successful save", async () => {
    const user = userEvent.setup();
    testState.upload.mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      type: "image",
      url: "/uploads/media/staged-social.png",
      filename: "staged-social.png",
    });
    const { container } = render(renderCreateDialog());
    const [, template] = screen.getAllByRole("combobox");

    await user.type(screen.getByLabelText("titleAr"), "الرئيسية");
    await user.type(screen.getByLabelText("titleEn"), "Home");
    await user.selectOptions(template, "home");
    const file = new File(["image"], "social.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("uploadSeoImage"), file);
    await waitFor(() =>
      expect(container.querySelector("img")?.getAttribute("src")).toBe(
        "/uploads/media/staged-social.png"
      )
    );
    expect(screen.getAllByRole<HTMLSelectElement>("combobox")[2].value).toBe(
      "11111111-1111-4111-8111-111111111111"
    );
    expect(screen.getByRole("option", { name: "staged-social.png" })).toBeDefined();
    await user.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => expect(testState.create).toHaveBeenCalledOnce());
    const uploadToken = testState.upload.mock.calls[0][0].uploadToken as string;
    expect(uploadToken).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(testState.create).toHaveBeenCalledWith(
      expect.objectContaining({
        seoImageAssetId: "11111111-1111-4111-8111-111111111111",
        uploadToken,
      }),
      expect.any(Object)
    );
  });

  it("keeps Save disabled until the SEO image upload finishes", async () => {
    const user = userEvent.setup();
    let resolveUpload!: (asset: { id: string; type: "image" }) => void;
    testState.upload.mockReturnValue(
      new Promise((resolve) => {
        resolveUpload = resolve;
      })
    );
    render(renderCreateDialog());
    const [, template] = screen.getAllByRole("combobox");
    await user.type(screen.getByLabelText("titleAr"), "الرئيسية");
    await user.type(screen.getByLabelText("titleEn"), "Home");
    await user.selectOptions(template, "home");
    const save = screen.getByRole("button", { name: "save" });

    await user.upload(
      screen.getByLabelText("uploadSeoImage"),
      new File(["image"], "social.png", { type: "image/png" })
    );
    await waitFor(() => expect(testState.upload).toHaveBeenCalledOnce());
    expect(save).toHaveProperty("disabled", true);
    await user.click(save);
    expect(testState.create).not.toHaveBeenCalled();

    resolveUpload({ id: "11111111-1111-4111-8111-111111111111", type: "image" });
    await waitFor(() => expect(save).toHaveProperty("disabled", false));
  });

  it("applies a completed SEO upload and re-enables Save in Strict Mode", async () => {
    const user = userEvent.setup();
    testState.upload.mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      type: "image",
      url: "/uploads/media/staged-social.png",
      filename: "staged-social.png",
    });
    const { container } = render(<StrictMode>{renderCreateDialog()}</StrictMode>);
    const [, template] = screen.getAllByRole("combobox");

    await user.type(screen.getByLabelText("titleAr"), "الرئيسية");
    await user.type(screen.getByLabelText("titleEn"), "Home");
    await user.selectOptions(template, "home");
    await user.upload(
      screen.getByLabelText("uploadSeoImage"),
      new File(["image"], "social.png", { type: "image/png" })
    );

    await waitFor(() => expect(testState.upload).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(screen.getByRole<HTMLButtonElement>("button", { name: "save" }).disabled).toBe(false)
    );
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "/uploads/media/staged-social.png"
    );
  });

  it("reports an SEO upload failure and re-enables Save", async () => {
    const user = userEvent.setup();
    testState.upload.mockRejectedValue(new Error("upload failed"));
    render(renderCreateDialog());
    const [, template] = screen.getAllByRole("combobox");
    await user.type(screen.getByLabelText("titleAr"), "الرئيسية");
    await user.type(screen.getByLabelText("titleEn"), "Home");
    await user.selectOptions(template, "home");
    const save = screen.getByRole("button", { name: "save" });

    await user.upload(
      screen.getByLabelText("uploadSeoImage"),
      new File(["image"], "social.png", { type: "image/png" })
    );

    expect(await screen.findByText("uploadAssetError")).toBeDefined();
    expect(save).toHaveProperty("disabled", false);
  });

  it("creates a distinct upload token for each page editor instance", async () => {
    const user = userEvent.setup();
    const tokens: string[] = [];
    testState.upload.mockImplementation(async (input: { uploadToken: string }) => {
      tokens.push(input.uploadToken);
      return { id: crypto.randomUUID(), type: "image" };
    });
    const first = render(renderCreateDialog());
    await user.upload(
      screen.getByLabelText("uploadSeoImage"),
      new File(["first"], "first.png", { type: "image/png" })
    );
    await waitFor(() => expect(tokens).toHaveLength(1));
    first.unmount();

    render(renderCreateDialog());
    await user.upload(
      screen.getByLabelText("uploadSeoImage"),
      new File(["second"], "second.png", { type: "image/png" })
    );
    await waitFor(() => expect(tokens).toHaveLength(2));

    expect(tokens[0]).not.toBe(tokens[1]);
  });

  it("does not send a cleanup or save request when closing an editor", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<CmsPageDialog mode="create" onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "cancel" }));

    expect(onClose).toHaveBeenCalledOnce();
    expect(testState.create).not.toHaveBeenCalled();
    expect(testState.removeMedia).not.toHaveBeenCalled();
  });

  it("shows a reload-and-retry message for a media concurrency conflict", async () => {
    const user = userEvent.setup();
    render(renderCreateDialog());

    await user.type(screen.getByLabelText("titleAr"), "من نحن");
    await user.type(screen.getByLabelText("titleEn"), "About us");
    await user.type(screen.getByLabelText("slug"), "about-us");
    await user.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => expect(testState.create).toHaveBeenCalledOnce());
    const options = testState.create.mock.calls[0][1] as { onError: (error: unknown) => void };
    act(() => {
      options.onError(
        new ApiError(409, "Concurrent media mutation", {
          message: { code: "CMS_MEDIA_CONCURRENCY_CONFLICT" },
        })
      );
    });

    expect((await screen.findByRole("alert")).textContent).toBe("mediaConcurrencyConflict");
  });

  it("does not submit the retired page row version when editing", async () => {
    const user = userEvent.setup();
    render(<CmsPageDialog mode="edit" page={regularPage} onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => expect(testState.update).toHaveBeenCalledOnce());
    const mutation = testState.update.mock.calls[0][0];
    expect(mutation.id).toBe("about-id");
    expect(mutation.payload).not.toHaveProperty("version");
  });

  it("maps non-media page conflicts to the slug message", async () => {
    const user = userEvent.setup();
    render(<CmsPageDialog mode="edit" page={regularPage} onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "save" }));
    await waitFor(() => expect(testState.update).toHaveBeenCalledOnce());
    const options = testState.update.mock.calls[0][1] as { onError: (error: unknown) => void };

    act(() => {
      options.onError(new ApiError(409, "Conflict", { message: { code: "CMS_PAGE_CONFLICT" } }));
    });

    expect((await screen.findByRole("alert")).textContent).toBe("slugConflict");
  });

  it("creates the first homepage with the protected classification and live state", async () => {
    const user = userEvent.setup();
    render(renderCreateDialog());
    const [, template] = screen.getAllByRole("combobox");

    await user.type(screen.getByLabelText("titleAr"), "الرئيسية");
    await user.type(screen.getByLabelText("titleEn"), "Home");
    await user.selectOptions(template, "home");

    const [category] = screen.getAllByRole("combobox");
    expect(screen.getByLabelText("slug")).toHaveProperty("value", "home");
    expect(screen.getByLabelText("slug")).toHaveProperty("readOnly", true);
    expect(category).toHaveProperty("value", "info");
    expect(category.getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByRole("checkbox", { name: "isActive" })).toHaveProperty("disabled", true);

    await user.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() =>
      expect(testState.create).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: "home",
          category: "info",
          template: "home",
          isActive: true,
        }),
        expect.any(Object)
      )
    );
  });

  it("keeps an existing homepage classification and active state protected", () => {
    render(<CmsPageDialog mode="edit" page={homepage} onClose={vi.fn()} />);
    const [category, template] = screen.getAllByRole("combobox");

    expect(screen.getByLabelText("slug")).toHaveProperty("readOnly", true);
    expect(category.getAttribute("aria-disabled")).toBe("true");
    expect(template.getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByRole("checkbox", { name: "isActive" })).toHaveProperty("disabled", true);
  });

  it("clears and unlocks the protected slug when changing back to a regular template", async () => {
    const user = userEvent.setup();
    render(renderCreateDialog());
    const [, template] = screen.getAllByRole("combobox");

    await user.selectOptions(template, "home");
    await user.selectOptions(template, "default");

    expect(screen.getByLabelText("slug")).toHaveProperty("value", "");
    expect(screen.getByLabelText("slug")).toHaveProperty("readOnly", false);
    expect(screen.getAllByRole("combobox")[0].getAttribute("aria-disabled")).toBe("false");
    expect(screen.getByRole("checkbox", { name: "isActive" })).toHaveProperty("disabled", false);
  });
});

describe("CmsPageDialog SEO asset deletion", () => {
  beforeEach(() => {
    testState.mediaAssets = [];
  });

  it("discloses orphan-media deletion before confirming page deletion", async () => {
    const user = userEvent.setup();
    render(<CmsPageDialog mode="view" page={regularPage} onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "delete" }));

    expect(screen.getByText("confirmDeleteMsg")).toBeDefined();
  });

  it("hides deletion when any media usage count is missing", async () => {
    testState.mediaAssets = [
      {
        id: "partially-counted",
        type: "image",
        filename: "partial.png",
        url: "/uploads/media/partial.png",
        _count: { usages: 0, seoImagePages: 0 },
      },
    ];
    const user = userEvent.setup();
    render(renderCreateDialog());
    const seoAsset = screen.getAllByRole("combobox")[2];

    await user.selectOptions(seoAsset, "partially-counted");

    expect(screen.queryByRole("button", { name: "deleteUnusedAsset" })).toBeNull();
  });

  it("shows deletion when every media usage count is known to be zero", async () => {
    testState.mediaAssets = [
      {
        id: "unused-asset",
        type: "image",
        filename: "unused.png",
        url: "/uploads/media/unused.png",
        _count: { usages: 0, seoImagePages: 0, platformLogoSettings: 0 },
      },
    ];
    const user = userEvent.setup();
    render(renderCreateDialog());
    const seoAsset = screen.getAllByRole("combobox")[2];

    await user.selectOptions(seoAsset, "unused-asset");

    expect(screen.getByRole("button", { name: "deleteUnusedAsset" })).toBeDefined();
  });
});
