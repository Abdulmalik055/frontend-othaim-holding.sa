import type { CmsAssetsById, CmsMediaAsset } from "@/features/admin/cms/schemas/cms-section.schema";

export function resolveCmsMediaAsset(
  assetId: string | undefined,
  assetsById: CmsAssetsById,
  libraryAssets?: readonly CmsMediaAsset[]
) {
  if (!assetId) return null;

  return libraryAssets?.find((asset) => asset.id === assetId) ?? assetsById[assetId] ?? null;
}

export function canDeleteCmsMediaAsset(asset: CmsMediaAsset | null | undefined) {
  const counts = asset?._count;

  return counts?.usages === 0 && counts.seoImagePages === 0 && counts.platformLogoSettings === 0;
}
