// @vitest-environment happy-dom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlatformLogoField } from "./PlatformLogoField";

const testState = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  isPending: false,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("../hooks/useAdminSettingsMutation", () => ({
  useAdminSettingsLogoUpload: () => testState,
}));

describe("PlatformLogoField", () => {
  beforeEach(() => {
    testState.mutateAsync.mockReset();
    testState.isPending = false;
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:logo-preview"),
      revokeObjectURL: vi.fn(),
    });
  });

  it("uploads an image as temporary media and selects the returned asset", async () => {
    testState.mutateAsync.mockResolvedValue({
      id: "logo-id",
      type: "image",
      url: "/uploads/media/platform-logo.png",
    });
    const onChange = vi.fn();
    const onUploadingChange = vi.fn();
    render(
      <PlatformLogoField
        uploadToken="settings-editor-token"
        logoAssetId={null}
        logoUrl={null}
        onChange={onChange}
        onUploadingChange={onUploadingChange}
      />
    );
    const file = new File(["image"], "logo.png", { type: "image/png" });

    fireEvent.change(screen.getByLabelText("logoUploadLabel"), {
      target: { files: [file] },
    });

    await waitFor(() => expect(testState.mutateAsync).toHaveBeenCalledOnce());
    expect(testState.mutateAsync).toHaveBeenCalledWith({
      file,
      uploadToken: "settings-editor-token",
    });
    expect(onChange).toHaveBeenCalledWith({
      logoAssetId: "logo-id",
      logoUrl: "blob:logo-preview",
    });
    expect(onUploadingChange.mock.calls).toEqual([[true], [false]]);
  });

  it("lets an administrator clear the selected logo", () => {
    const onChange = vi.fn();
    render(
      <PlatformLogoField
        uploadToken="settings-editor-token"
        logoAssetId="logo-id"
        logoUrl="/uploads/media/platform-logo.png"
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "logoRemove" }));

    expect(onChange).toHaveBeenCalledWith({ logoAssetId: null, logoUrl: null });
  });

  it("ignores an older upload that finishes after a newer selection", async () => {
    let resolveFirst!: (value: { id: string }) => void;
    let resolveSecond!: (value: { id: string }) => void;
    testState.mutateAsync
      .mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)))
      .mockReturnValueOnce(new Promise((resolve) => (resolveSecond = resolve)));
    const onChange = vi.fn();
    render(
      <PlatformLogoField
        uploadToken="settings-editor-token"
        logoAssetId={null}
        logoUrl={null}
        onChange={onChange}
      />
    );
    const input = screen.getByLabelText("logoUploadLabel");

    fireEvent.change(input, {
      target: { files: [new File(["first"], "first.png", { type: "image/png" })] },
    });
    fireEvent.change(input, {
      target: { files: [new File(["second"], "second.png", { type: "image/png" })] },
    });
    resolveSecond({ id: "second-logo" });
    await waitFor(() => expect(onChange).toHaveBeenCalledOnce());
    resolveFirst({ id: "first-logo" });
    await waitFor(() => expect(testState.mutateAsync).toHaveBeenCalledTimes(2));

    expect(onChange).toHaveBeenCalledWith({
      logoAssetId: "second-logo",
      logoUrl: "blob:logo-preview",
    });
  });
});
