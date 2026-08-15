// @vitest-environment happy-dom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsGeneralTab } from "./SettingsGeneralTab";

const testState = vi.hoisted(() => ({
  update: vi.fn(),
  logoTokens: [] as Array<string | undefined>,
  settings: {
    nameAr: "المنصة",
    nameEn: "Platform",
    bioAr: "",
    bioEn: "",
    email: "",
    phone: "",
    addressAr: "",
    addressEn: "",
    workingHoursAr: "",
    workingHoursEn: "",
    socialLinks: {},
    logoAssetId: null,
    logoUrl: null,
  },
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("../hooks/useAdminSettings", () => ({
  useAdminSettings: () => ({
    isLoading: false,
    data: testState.settings,
  }),
}));

vi.mock("../hooks/useAdminSettingsMutation", () => ({
  useAdminSettingsUpdate: () => ({
    mutateAsync: testState.update,
    isPending: false,
    isError: false,
  }),
}));

vi.mock("./PlatformLogoField", () => ({
  PlatformLogoField: (props: { uploadToken?: string }) => {
    testState.logoTokens.push(props.uploadToken);
    return <div>logoField</div>;
  },
}));

describe("SettingsGeneralTab editor session", () => {
  beforeEach(() => {
    testState.update.mockReset().mockResolvedValue({});
    testState.logoTokens = [];
  });

  it("shares one cryptographic token with logo uploads and the settings Save payload", async () => {
    const user = userEvent.setup();
    render(<SettingsGeneralTab />);
    await user.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => expect(testState.update).toHaveBeenCalledOnce());
    const logoToken = testState.logoTokens.find(Boolean);
    expect(logoToken).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(testState.update).toHaveBeenCalledWith(
      expect.objectContaining({ uploadToken: logoToken })
    );
    expect(testState.update.mock.calls[0][0]).not.toHaveProperty("version");
  });

  it.each(["CMS_MEDIA_CONCURRENCY_CONFLICT", "CMS_SETTINGS_CONFLICT"])(
    "shows reload-and-retry guidance for %s",
    async (code) => {
      const user = userEvent.setup();
      testState.update.mockRejectedValue({
        status: 409,
        data: { code },
      });
      render(<SettingsGeneralTab />);

      await user.click(screen.getByRole("button", { name: "save" }));

      expect(await screen.findByText("mediaConcurrencyConflict")).toBeDefined();
    }
  );
});
