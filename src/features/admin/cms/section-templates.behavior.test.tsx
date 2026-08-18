// @vitest-environment happy-dom

import { StrictMode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CmsSectionContent } from "./schemas/cms-section.schema";
import { CmsSectionContentEditor } from "./section-templates";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/features/admin/cms/hooks/useCmsPages", () => ({
  useCmsLinkPages: () => ({
    data: [],
    isSuccess: true,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

const testState = vi.hoisted(() => ({ upload: vi.fn() }));

vi.mock("@/features/admin/cms/hooks/useCmsSectionMutate", () => ({
  useAdminMediaAssets: () => ({ data: { data: [] }, refetch: vi.fn() }),
  useAdminMediaDelete: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAdminMediaUpload: () => ({ mutateAsync: testState.upload, isPending: false }),
}));

const paragraphContent: CmsSectionContent = {
  blocks: [
    {
      items: [
        {
          key: "body",
          type: "text",
          text: { format: "p", textAr: "نص", textEn: "Text" },
        },
      ],
    },
  ],
};

function renderEditor(content: CmsSectionContent, onUploadingChange = vi.fn()) {
  return render(
    <CmsSectionContentEditor
      pageId="page-1"
      uploadToken="section-editor-token"
      content={content}
      assetsById={{}}
      onAssetUploaded={vi.fn()}
      onChange={vi.fn()}
      autoConvertMessages={{}}
      canDeleteAssets={false}
      onUploadingChange={onUploadingChange}
    />
  );
}

describe("CmsSectionContentEditor text formats", () => {
  beforeEach(() => {
    testState.upload.mockReset();
  });

  it("offers headings, paragraphs, and semantic list formats", async () => {
    const user = userEvent.setup();

    renderEditor(paragraphContent);

    await user.click(screen.getByRole("combobox"));

    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "formatH1",
      "formatH2",
      "formatH3",
      "formatP",
      "formatUl",
      "formatOl",
    ]);
  });

  it("reuses the section editor token across every media field", async () => {
    testState.upload
      .mockResolvedValueOnce({ id: "desktop-image", type: "image" })
      .mockResolvedValueOnce({ id: "mobile-image", type: "image" });
    const imageContent: CmsSectionContent = {
      blocks: [
        {
          items: [
            {
              key: "hero",
              type: "image",
              image: {
                desktopAssetId: "",
                mobileAssetId: "",
                altAr: "صورة",
                altEn: "Image",
              },
            },
          ],
        },
      ],
    };

    const { container } = renderEditor(imageContent);
    const [desktopInput, mobileInput] = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[type="file"]')
    );
    const desktopFile = new File(["desktop"], "desktop.png", { type: "image/png" });
    const mobileFile = new File(["mobile"], "mobile.png", { type: "image/png" });

    fireEvent.change(desktopInput, { target: { files: [desktopFile] } });
    await waitFor(() => expect(testState.upload).toHaveBeenCalledTimes(1));
    fireEvent.change(mobileInput, { target: { files: [mobileFile] } });
    await waitFor(() => expect(testState.upload).toHaveBeenCalledTimes(2));

    expect(testState.upload.mock.calls.map(([input]) => input.uploadToken)).toEqual([
      "section-editor-token",
      "section-editor-token",
    ]);
  });

  it("reports one uploading interval while concurrent media fields are in flight", async () => {
    let resolveDesktop!: (asset: { id: string; type: "image" }) => void;
    let resolveMobile!: (asset: { id: string; type: "image" }) => void;
    testState.upload
      .mockReturnValueOnce(new Promise((resolve) => (resolveDesktop = resolve)))
      .mockReturnValueOnce(new Promise((resolve) => (resolveMobile = resolve)));
    const onUploadingChange = vi.fn();
    const imageContent: CmsSectionContent = {
      blocks: [
        {
          items: [
            {
              key: "hero",
              type: "image",
              image: {
                desktopAssetId: "",
                mobileAssetId: "",
                altAr: "صورة",
                altEn: "Image",
              },
            },
          ],
        },
      ],
    };
    const { container } = renderEditor(imageContent, onUploadingChange);
    const [desktopInput, mobileInput] = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[type="file"]')
    );

    fireEvent.change(desktopInput, {
      target: { files: [new File(["desktop"], "desktop.png", { type: "image/png" })] },
    });
    fireEvent.change(mobileInput, {
      target: { files: [new File(["mobile"], "mobile.png", { type: "image/png" })] },
    });
    await waitFor(() => expect(testState.upload).toHaveBeenCalledTimes(2));
    expect(onUploadingChange.mock.calls).toEqual([[true]]);

    resolveDesktop({ id: "desktop-image", type: "image" });
    await waitFor(() => expect(onUploadingChange).toHaveBeenCalledTimes(1));
    resolveMobile({ id: "mobile-image", type: "image" });
    await waitFor(() => expect(onUploadingChange.mock.calls).toEqual([[true], [false]]));
  });

  it("applies a completed media upload and closes its interval in Strict Mode", async () => {
    testState.upload.mockResolvedValue({ id: "desktop-image", type: "image" });
    const onAssetUploaded = vi.fn();
    const onChange = vi.fn();
    const onUploadingChange = vi.fn();
    const imageContent: CmsSectionContent = {
      blocks: [
        {
          items: [
            {
              key: "hero",
              type: "image",
              image: {
                desktopAssetId: "",
                altAr: "صورة",
                altEn: "Image",
              },
            },
          ],
        },
      ],
    };
    const { container } = render(
      <StrictMode>
        <CmsSectionContentEditor
          pageId="page-1"
          uploadToken="section-editor-token"
          content={imageContent}
          assetsById={{}}
          onAssetUploaded={onAssetUploaded}
          onChange={onChange}
          autoConvertMessages={{}}
          canDeleteAssets={false}
          onUploadingChange={onUploadingChange}
        />
      </StrictMode>
    );

    fireEvent.change(container.querySelector<HTMLInputElement>('input[type="file"]')!, {
      target: { files: [new File(["image"], "hero.png", { type: "image/png" })] },
    });

    await waitFor(() => expect(testState.upload).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(onAssetUploaded).toHaveBeenCalledWith({
        id: "desktop-image",
        type: "image",
      })
    );
    expect(onChange).toHaveBeenCalled();
    expect(onUploadingChange.mock.calls).toEqual([[true], [false]]);
  });

  it("keeps the editor uploading while an in-flight field is no longer active", async () => {
    let resolveUpload!: (asset: { id: string; type: "image" }) => void;
    testState.upload.mockReturnValue(
      new Promise((resolve) => {
        resolveUpload = resolve;
      })
    );
    const onUploadingChange = vi.fn();
    const content: CmsSectionContent = {
      blocks: [
        {
          items: [
            {
              key: "hero",
              type: "image",
              image: { desktopAssetId: "", altAr: "صورة", altEn: "Image" },
            },
            {
              key: "body",
              type: "text",
              text: { format: "p", textAr: "نص", textEn: "Text" },
            },
          ],
        },
      ],
    };
    const user = userEvent.setup();
    const { container } = renderEditor(content, onUploadingChange);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;

    fireEvent.change(input, {
      target: { files: [new File(["image"], "hero.png", { type: "image/png" })] },
    });
    await waitFor(() => expect(onUploadingChange.mock.calls).toEqual([[true]]));
    await user.click(screen.getByRole("button", { name: /item 2 itemTypeText editAction/ }));
    expect(container.querySelector('input[type="file"]')).toBeNull();
    expect(onUploadingChange.mock.calls).toEqual([[true]]);

    resolveUpload({ id: "hero-image", type: "image" });
    await waitFor(() => expect(onUploadingChange.mock.calls).toEqual([[true], [false]]));
  });

  it("does not apply an upload that finishes after its media field unmounts", async () => {
    let resolveUpload!: (asset: { id: string; type: "image" }) => void;
    testState.upload.mockReturnValue(
      new Promise((resolve) => {
        resolveUpload = resolve;
      })
    );
    const onAssetUploaded = vi.fn();
    const onChange = vi.fn();
    const content: CmsSectionContent = {
      blocks: [
        {
          items: [
            {
              key: "hero",
              type: "image",
              image: { desktopAssetId: "", altAr: "صورة", altEn: "Image" },
            },
            {
              key: "body",
              type: "text",
              text: { format: "p", textAr: "نص", textEn: "Text" },
            },
          ],
        },
      ],
    };
    const user = userEvent.setup();
    const { container } = render(
      <CmsSectionContentEditor
        pageId="page-1"
        uploadToken="section-editor-token"
        content={content}
        assetsById={{}}
        onAssetUploaded={onAssetUploaded}
        onChange={onChange}
        autoConvertMessages={{}}
        canDeleteAssets={false}
        onUploadingChange={vi.fn()}
      />
    );

    fireEvent.change(container.querySelector<HTMLInputElement>('input[type="file"]')!, {
      target: { files: [new File(["image"], "hero.png", { type: "image/png" })] },
    });
    await waitFor(() => expect(testState.upload).toHaveBeenCalledOnce());
    await user.click(screen.getByRole("button", { name: /item 2 itemTypeText editAction/ }));
    resolveUpload({ id: "stale-upload", type: "image" });
    await waitFor(() => expect(testState.upload).toHaveBeenCalledOnce());

    expect(onAssetUploaded).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("locks client structural keys and types while allowing repeat blocks", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const content: CmsSectionContent = {
      blocks: [
        {
          items: [
            {
              key: "eyebrow",
              type: "text",
              text: { format: "p", textAr: "فلسفتنا", textEn: "Philosophies" },
            },
          ],
        },
        {
          items: [
            {
              key: "number",
              type: "text",
              text: { format: "p", textAr: "01", textEn: "01" },
            },
            {
              key: "name",
              type: "text",
              text: { format: "h3", textAr: "الاسم", textEn: "Name" },
            },
            {
              key: "body",
              type: "text",
              text: { format: "p", textAr: "النص", textEn: "Body" },
            },
          ],
        },
      ],
    };
    const { container } = render(
      <CmsSectionContentEditor
        pageId="page-1"
        sectionSlug="home-philosophies"
        uploadToken="section-editor-token"
        content={content}
        assetsById={{}}
        onAssetUploaded={vi.fn()}
        onChange={onChange}
        autoConvertMessages={{}}
        canDeleteAssets={false}
      />
    );

    expect(container.querySelector<HTMLInputElement>('input[value="eyebrow"]')?.disabled).toBe(
      true
    );
    expect(screen.getByText("protectedStructureNotice")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /addBlockShort/ }));

    const nextContent = onChange.mock.calls.at(-1)?.[0] as CmsSectionContent;
    expect(nextContent.blocks.at(-1)?.items.map(({ key, type }) => [key, type])).toEqual([
      ["number", "text"],
      ["name", "text"],
      ["body", "text"],
    ]);
  });
});
