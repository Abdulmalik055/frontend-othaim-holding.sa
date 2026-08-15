// @vitest-environment happy-dom

import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CmsSectionDialog } from "./CmsSectionDialog";

const testState = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  editorProps: null as null | {
    uploadToken?: string;
    onUploadingChange?: (isUploading: boolean) => void;
  },
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/features/admin/cms/hooks/useUnsavedChanges", () => ({
  useUnsavedChanges: vi.fn(),
}));

vi.mock("@/features/admin/cms/hooks/useCmsSections", () => ({
  useCmsSectionDetail: () => ({ data: undefined, isLoading: false, isError: false }),
}));

vi.mock("@/features/admin/cms/hooks/useCmsSectionMutate", () => ({
  useCmsSectionCreate: () => ({ mutate: testState.create, isPending: false }),
  useCmsSectionUpdate: () => ({ mutate: testState.update, isPending: false }),
  useCmsSectionDelete: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/features/admin/cms/section-templates", () => {
  const defaultContent = {
    blocks: [
      {
        items: [{ key: "body", type: "text", text: { format: "p", textAr: "نص", textEn: "Text" } }],
      },
    ],
  };
  return {
    getDefaultCmsSectionContent: () => defaultContent,
    getInitialCmsSectionContent: (content: unknown) => content ?? defaultContent,
    CmsSectionContentEditor: (props: typeof testState.editorProps) => {
      testState.editorProps = props;
      return (
        <div>
          <button type="button" onClick={() => props?.onUploadingChange?.(true)}>
            startUpload
          </button>
          <button type="button" onClick={() => props?.onUploadingChange?.(false)}>
            finishUpload
          </button>
        </div>
      );
    },
  };
});

describe("CmsSectionDialog editor session", () => {
  beforeEach(() => {
    testState.create.mockReset();
    testState.update.mockReset();
    testState.editorProps = null;
  });

  it("passes one token to media fields and includes it in the successful save payload", async () => {
    const user = userEvent.setup();
    render(<CmsSectionDialog mode="create" pageId="page-1" onClose={vi.fn()} />);

    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "مقدمة");
    await user.type(inputs[1], "Introduction");
    await user.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => expect(testState.create).toHaveBeenCalledOnce());
    const uploadToken = testState.editorProps?.uploadToken;
    expect(uploadToken).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(testState.create).toHaveBeenCalledWith(
      expect.objectContaining({ uploadToken }),
      expect.any(Object)
    );
    expect(testState.create.mock.calls[0][0].content).toEqual({
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
    });
    expect(testState.create.mock.calls[0][0].content).not.toHaveProperty("version");
  });

  it("omits row and content versions from update payloads", async () => {
    const user = userEvent.setup();
    render(
      <CmsSectionDialog
        mode="edit"
        pageId="page-1"
        section={{
          id: "section-1",
          titleAr: "مقدمة",
          titleEn: "Introduction",
          content: {
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
          },
          order: 1,
          isActive: true,
        }}
        onClose={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => expect(testState.update).toHaveBeenCalledOnce());
    const mutation = testState.update.mock.calls[0][0];
    expect(mutation.sectionId).toBe("section-1");
    expect(mutation.payload).not.toHaveProperty("version");
    expect(mutation.payload.content).not.toHaveProperty("version");
  });

  it("maps non-media update conflicts to the section identifier message", async () => {
    const user = userEvent.setup();
    render(
      <CmsSectionDialog
        mode="edit"
        pageId="page-1"
        section={{
          id: "section-1",
          titleAr: "مقدمة",
          titleEn: "Introduction",
          content: {
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
          },
          order: 1,
          isActive: true,
        }}
        onClose={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "save" }));
    await waitFor(() => expect(testState.update).toHaveBeenCalledOnce());
    const options = testState.update.mock.calls[0][1] as { onError: (error: unknown) => void };

    act(() => {
      options.onError({ status: 409, data: { message: { code: "CMS_SECTION_CONFLICT" } } });
    });

    expect((await screen.findByRole("alert")).textContent).toBe("identifierConflict");
  });

  it("keeps Save disabled until editor media uploads finish", async () => {
    const user = userEvent.setup();
    render(<CmsSectionDialog mode="create" pageId="page-1" onClose={vi.fn()} />);
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "مقدمة");
    await user.type(inputs[1], "Introduction");
    const save = screen.getByRole("button", { name: "save" });

    expect(save).toHaveProperty("disabled", false);
    await user.click(screen.getByRole("button", { name: "startUpload" }));
    expect(save).toHaveProperty("disabled", true);
    await user.click(screen.getByRole("button", { name: "finishUpload" }));
    expect(save).toHaveProperty("disabled", false);
  });

  it("maps nested media concurrency conflicts to reload-and-retry guidance", async () => {
    const user = userEvent.setup();
    render(<CmsSectionDialog mode="create" pageId="page-1" onClose={vi.fn()} />);
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "مقدمة");
    await user.type(inputs[1], "Introduction");
    await user.click(screen.getByRole("button", { name: "save" }));
    await waitFor(() => expect(testState.create).toHaveBeenCalledOnce());
    const options = testState.create.mock.calls[0][1] as { onError: (error: unknown) => void };

    act(() => {
      options.onError({
        status: 409,
        data: { message: { code: "CMS_MEDIA_CONCURRENCY_CONFLICT" } },
      });
    });

    expect((await screen.findByRole("alert")).textContent).toBe("mediaConcurrencyConflict");
  });
});
