import { describe, expect, it } from "vitest";
import en from "./en/admin.json";
import ar from "./ar/admin.json";

describe("orphan media deletion translations", () => {
  it("warns in English before irreversible page, section, and logo cleanup", () => {
    expect(en.admin.cmsPage.pageDialog.confirmDeleteMsg).toContain("permanently removed");
    expect(en.admin.cmsPage.sectionDialog.confirmDeleteMsg).toContain("permanently removed");
    expect(en.admin.settingsPage.general.logoHint).toContain("permanently deleted");
    expect(en.admin.cmsPage.pageDialog.mediaConcurrencyConflict).toContain("Reload");
    expect(en.admin.cmsPage.sectionDialog.mediaConcurrencyConflict).toContain("Reload");
    expect(en.admin.settingsPage.general.mediaConcurrencyConflict).toContain("Reload");
  });

  it("warns in Arabic before irreversible page, section, and logo cleanup", () => {
    expect(ar.admin.cmsPage.pageDialog.confirmDeleteMsg).toContain("نهائياً");
    expect(ar.admin.cmsPage.sectionDialog.confirmDeleteMsg).toContain("نهائياً");
    expect(ar.admin.settingsPage.general.logoHint).toContain("نهائياً");
    expect(ar.admin.cmsPage.pageDialog.mediaConcurrencyConflict).toContain("أعد تحميل");
    expect(ar.admin.cmsPage.sectionDialog.mediaConcurrencyConflict).toContain("أعد تحميل");
    expect(ar.admin.settingsPage.general.mediaConcurrencyConflict).toContain("أعد تحميل");
  });
});
