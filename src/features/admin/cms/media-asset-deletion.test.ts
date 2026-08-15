import { describe, expect, it } from "vitest";
import {
  canDeleteCmsMediaAsset,
  resolveCmsMediaAsset,
} from "@/features/admin/cms/media-asset-deletion";
import type { CmsAssetsById, CmsMediaAsset } from "@/features/admin/cms/schemas/cms-section.schema";

const detailAsset: CmsMediaAsset = {
  id: "platform-logo",
  type: "image",
  url: "/uploads/media/platform-logo.png",
};

describe("CMS media deletion safety", () => {
  it("uses media-library counts instead of count-less section-detail assets", () => {
    const assetsById: CmsAssetsById = { [detailAsset.id]: detailAsset };
    const activeLogo = {
      ...detailAsset,
      _count: { usages: 0, seoImagePages: 0, platformLogoSettings: 1 },
    };

    const resolved = resolveCmsMediaAsset(detailAsset.id, assetsById, [activeLogo]);

    expect(resolved).toBe(activeLogo);
    expect(canDeleteCmsMediaAsset(resolved)).toBe(false);
  });

  it("fails closed when any usage count is unknown", () => {
    expect(canDeleteCmsMediaAsset(detailAsset)).toBe(false);
    expect(
      canDeleteCmsMediaAsset({
        ...detailAsset,
        _count: { usages: 0, seoImagePages: 0 },
      })
    ).toBe(false);
  });

  it("allows deletion only when every known usage count is zero", () => {
    expect(
      canDeleteCmsMediaAsset({
        ...detailAsset,
        _count: { usages: 0, seoImagePages: 0, platformLogoSettings: 0 },
      })
    ).toBe(true);
  });
});
