// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SettingsMain } from "./SettingsMain";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/ui/admin/AdminPageHeader", () => ({
  AdminPageHeader: () => <header>settings-header</header>,
}));

vi.mock("./SettingsGeneralTab", () => ({
  SettingsGeneralTab: () => <div>general-settings</div>,
}));

vi.mock("./SettingsIntegrationsTab", () => ({
  SettingsIntegrationsTab: () => <div>integration-settings</div>,
}));

describe("SettingsMain", () => {
  it("shows General settings without exposing the Integrations tab", () => {
    render(<SettingsMain />);

    expect(screen.getByRole("tab", { name: "tabGeneral" })).toBeDefined();
    expect(screen.getByText("general-settings")).toBeDefined();
    expect(screen.queryByRole("tab", { name: "tabIntegrations" })).toBeNull();
    expect(screen.queryByText("integration-settings")).toBeNull();
  });
});
