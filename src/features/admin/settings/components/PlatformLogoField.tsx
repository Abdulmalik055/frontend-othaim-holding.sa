"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminSettingsLogoUpload } from "../hooks/useAdminSettingsMutation";

const ACCEPTED_LOGO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);
const MAX_LOGO_SIZE = 10 * 1024 * 1024;

type Props = {
  uploadToken: string;
  logoAssetId: string | null;
  logoUrl: string | null;
  onChange: (value: { logoAssetId: string | null; logoUrl: string | null }) => void;
  onUploadingChange?: (isUploading: boolean) => void;
};

export function PlatformLogoField({
  uploadToken,
  logoAssetId,
  logoUrl,
  onChange,
  onUploadingChange,
}: Props) {
  const translations = useTranslations("admin.settingsPage.general");
  const inputId = useId();
  const upload = useAdminSettingsLogoUpload();
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const uploadSequence = useRef(0);
  const localPreviewUrl = useRef<string | null>(null);

  useEffect(() => {
    const previewUrl = localPreviewUrl.current;
    if (previewUrl && logoUrl !== previewUrl) {
      URL.revokeObjectURL(previewUrl);
      localPreviewUrl.current = null;
    }
  }, [logoUrl]);

  useEffect(
    () => () => {
      uploadSequence.current += 1;
      if (localPreviewUrl.current) {
        URL.revokeObjectURL(localPreviewUrl.current);
      }
    },
    []
  );

  async function handleFile(file?: File) {
    if (!file) return;
    setError("");
    if (!ACCEPTED_LOGO_TYPES.has(file.type)) {
      setError(translations("logoTypeError"));
      return;
    }
    if (file.size > MAX_LOGO_SIZE) {
      setError(translations("logoSizeError"));
      return;
    }

    const sequence = ++uploadSequence.current;
    setIsUploading(true);
    onUploadingChange?.(true);
    try {
      const asset = await upload.mutateAsync({ file, uploadToken });
      if (sequence !== uploadSequence.current) return;
      if (localPreviewUrl.current) {
        URL.revokeObjectURL(localPreviewUrl.current);
      }
      const previewUrl = URL.createObjectURL(file);
      localPreviewUrl.current = previewUrl;
      onChange({
        logoAssetId: asset.id,
        logoUrl: previewUrl,
      });
    } catch {
      if (sequence === uploadSequence.current) {
        setError(translations("logoUploadError"));
      }
    } finally {
      if (sequence === uploadSequence.current) {
        setIsUploading(false);
        onUploadingChange?.(false);
      }
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
        {logoUrl ? (
          // Unsaved selections use a browser object URL; saved logos use the public media URL.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={translations("logoPreviewAlt")}
            className="max-h-24 max-w-full object-contain"
          />
        ) : (
          <span className="text-sm text-gray-400">{translations("logoEmpty")}</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor={inputId}
          aria-disabled={isUploading}
          className={`inline-flex min-h-10 items-center rounded-lg bg-admin-primary px-4 text-sm font-semibold text-white transition-opacity ${
            isUploading ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:opacity-90"
          }`}
        >
          {isUploading
            ? translations("logoUploading")
            : translations(logoAssetId ? "logoReplace" : "logoUpload")}
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          aria-label={translations("logoUploadLabel")}
          disabled={isUploading}
          className="sr-only"
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
            event.currentTarget.value = "";
          }}
        />
        {logoAssetId && (
          <button
            type="button"
            disabled={isUploading}
            className="min-h-10 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-danger transition-colors hover:bg-danger-bg-faint disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => {
              uploadSequence.current += 1;
              if (localPreviewUrl.current) {
                URL.revokeObjectURL(localPreviewUrl.current);
                localPreviewUrl.current = null;
              }
              setError("");
              onChange({ logoAssetId: null, logoUrl: null });
            }}
          >
            {translations("logoRemove")}
          </button>
        )}
      </div>
      <p className="text-xs leading-5 text-gray-400">{translations("logoHint")}</p>
      {error && <p className="text-xs font-semibold text-danger">{error}</p>}
    </div>
  );
}
