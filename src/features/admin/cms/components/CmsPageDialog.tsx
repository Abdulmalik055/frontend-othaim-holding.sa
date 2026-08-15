"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, type Control, type Resolver, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { AdminDialog } from "@/components/ui/admin/AdminDialog";
import { AdminInput } from "@/components/ui/admin/AdminInput";
import { AdminTextArea } from "@/components/ui/admin/AdminTextArea";
import { ApiError } from "@/lib/api-client";
import { getApiErrorCode } from "@/lib/api-error-code";
import { Spinner } from "@/components/ui/shared/Spinner";
import { ChevronLeftIcon, EditIcon, TrashIcon } from "@/components/ui/shared/Icons";
import {
  useCmsPageCreate,
  useCmsPageDelete,
  useCmsPageUpdate,
} from "@/features/admin/cms/hooks/useCmsPageMutate";
import type { CmsPage } from "@/features/admin/cms/hooks/useCmsPages";
import { useUnsavedChanges } from "@/features/admin/cms/hooks/useUnsavedChanges";
import { cmsPageSchema, type CmsPageFormData } from "@/features/admin/cms/schemas/cms-page.schema";
import { CMS_PAGE_CATEGORIES, CMS_PAGE_TEMPLATES } from "@/features/admin/cms/types";
import {
  useAdminMediaAssets,
  useAdminMediaDelete,
  useAdminMediaUpload,
} from "@/features/admin/cms/hooks/useCmsSectionMutate";
import { canDeleteCmsMediaAsset } from "@/features/admin/cms/media-asset-deletion";
import type { CmsMediaAsset } from "@/features/admin/cms/schemas/cms-section.schema";

type DialogMode = "create" | "view" | "edit";
type Props = {
  mode: DialogMode;
  page?: CmsPage;
  onClose: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
};

const labelClass = "mb-1.5 block text-xs font-bold text-gray-500";
const selectClass =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-admin-primary";

function defaults(page?: CmsPage): CmsPageFormData {
  return {
    slug: page?.slug ?? "",
    titleAr: page?.titleAr ?? "",
    titleEn: page?.titleEn ?? "",
    category: page?.category ?? "info",
    template: page?.template ?? "default",
    seoTitleAr: page?.seoTitleAr ?? "",
    seoTitleEn: page?.seoTitleEn ?? "",
    seoDescriptionAr: page?.seoDescriptionAr ?? "",
    seoDescriptionEn: page?.seoDescriptionEn ?? "",
    seoImageAssetId: page?.seoImageAssetId ?? null,
    isIndexable: page?.isIndexable ?? true,
    isActive: page?.isActive ?? true,
  };
}

export function CmsPageDialog({
  mode: initialMode,
  page,
  onClose,
  canEdit = true,
  canDelete = true,
}: Props) {
  const t = useTranslations("admin.cmsPage.pageDialog");
  const [mode, setMode] = useState(initialMode);
  const [uploadToken] = useState(() => crypto.randomUUID());
  const [isMediaUploading, setIsMediaUploading] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isHomepage = Boolean(page?.template === "home" || page?.slug === "home");
  const createMutation = useCmsPageCreate();
  const updateMutation = useCmsPageUpdate();
  const deleteMutation = useCmsPageDelete();
  const pending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const form = useForm<CmsPageFormData>({
    resolver: zodResolver(cmsPageSchema) as Resolver<CmsPageFormData>,
    defaultValues: defaults(page),
  });
  const categoryField = form.register("category");
  const templateField = form.register("template");
  const template = useWatch({ control: form.control, name: "template" });
  const isActive = useWatch({ control: form.control, name: "isActive" });
  const isCreatingHomepage = mode === "create" && template === "home";
  const homepageClassificationLocked = isHomepage || isCreatingHomepage;
  useUnsavedChanges(mode !== "view" && form.formState.isDirty, t("unsavedWarning"));

  function guardedClose() {
    if (mode !== "view" && form.formState.isDirty && !window.confirm(t("unsavedWarning"))) return;
    onClose();
  }

  const submit = form.handleSubmit((payload) => {
    if (isMediaUploading) return;
    setError("");
    const onError = (cause: unknown) => {
      if (cause instanceof ApiError && cause.status === 409) {
        const code = getApiErrorCode(cause.data);
        setError(
          code === "CMS_MEDIA_CONCURRENCY_CONFLICT"
            ? t("mediaConcurrencyConflict")
            : t("slugConflict")
        );
      } else setError(t("saveError"));
    };
    if (mode === "create") {
      createMutation.mutate({ ...payload, uploadToken }, { onSuccess: onClose, onError });
    } else if (page) {
      updateMutation.mutate(
        { id: page.id, payload: { ...payload, uploadToken } },
        { onSuccess: onClose, onError }
      );
    }
  });

  function removePage() {
    if (!page) return;
    deleteMutation.mutate(page.id, {
      onSuccess: onClose,
      onError: () => setError(t("deleteError")),
    });
  }

  const footer =
    mode === "view" ? (
      <>
        <div>
          {canDelete && !isHomepage && !confirmDelete && (
            <button
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 px-4 text-sm font-bold text-red-700"
              onClick={() => setConfirmDelete(true)}
            >
              <TrashIcon /> {t("delete")}
            </button>
          )}
          {confirmDelete && (
            <div className="flex max-w-md items-center gap-3">
              <span className="text-xs font-semibold text-red-700">{t("confirmDeleteMsg")}</span>
              <button
                disabled={pending}
                className="h-10 shrink-0 rounded-lg bg-red-700 px-4 text-sm font-bold text-white"
                onClick={removePage}
              >
                {t("confirmDelete")}
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button className="h-10 rounded-lg border border-gray-200 px-5 text-sm" onClick={onClose}>
            {t("cancel")}
          </button>
          {canEdit && (
            <button
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-admin-primary px-5 text-sm font-bold text-white"
              onClick={() => setMode("edit")}
            >
              <EditIcon /> {t("edit")}
            </button>
          )}
        </div>
      </>
    ) : (
      <div className="ms-auto flex gap-3">
        <button
          disabled={pending}
          className="h-10 rounded-lg border border-gray-200 px-5 text-sm"
          onClick={guardedClose}
        >
          {t("cancel")}
        </button>
        <button
          disabled={pending || isMediaUploading}
          className="h-10 rounded-lg bg-admin-primary px-5 text-sm font-bold text-white disabled:opacity-50"
          onClick={submit}
        >
          {pending ? <Spinner /> : t("save")}
        </button>
      </div>
    );

  return (
    <AdminDialog
      title={mode === "create" ? t("addTitle") : mode === "edit" ? t("editTitle") : t("viewTitle")}
      onClose={guardedClose}
      footer={footer}
      size="xl"
    >
      {mode === "view" && page ? (
        <div className="grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-5 text-sm">
          <h3 className="text-xl font-black text-gray-900">{page.titleAr}</h3>
          <p dir="ltr" className="text-gray-500">
            {page.titleEn}
          </p>
          <code dir="ltr" className="w-fit rounded bg-white px-2 py-1">
            /{page.category}/{page.slug}
          </code>
          <p>
            {t("sections")}: {page.sectionsCount ?? page._count?.sections ?? 0}
          </p>
        </div>
      ) : (
        <form className="grid gap-7" onSubmit={submit}>
          {isActive && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
              {t("liveSaveNotice")}
            </p>
          )}
          <fieldset className="grid gap-4 md:grid-cols-2">
            <legend className="mb-3 text-sm font-black text-gray-800">{t("basics")}</legend>
            <Controller
              name="titleAr"
              control={form.control}
              render={({ field, fieldState }) => (
                <AdminInput
                  {...field}
                  label={t("titleAr")}
                  dir="rtl"
                  textLanguage="arabic"
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="titleEn"
              control={form.control}
              render={({ field, fieldState }) => (
                <AdminInput
                  {...field}
                  label={t("titleEn")}
                  dir="ltr"
                  textLanguage="english"
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="slug"
              control={form.control}
              render={({ field, fieldState }) => (
                <AdminInput
                  {...field}
                  label={t("slug")}
                  dir="ltr"
                  autoConvertMode="none"
                  readOnly={homepageClassificationLocked}
                  error={fieldState.error?.message}
                />
              )}
            />
            <div>
              <label className={labelClass}>{t("category")}</label>
              <select
                className={`${selectClass} ${homepageClassificationLocked ? "pointer-events-none opacity-60" : ""}`}
                aria-disabled={homepageClassificationLocked}
                tabIndex={homepageClassificationLocked ? -1 : undefined}
                {...categoryField}
                onChange={(event) => {
                  if (homepageClassificationLocked) {
                    event.currentTarget.value = "info";
                    return;
                  }
                  void categoryField.onChange(event);
                }}
              >
                {CMS_PAGE_CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {t(value === "info" ? "categoryInfo" : "categoryLegal")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t("template")}</label>
              <select
                className={`${selectClass} ${isHomepage ? "pointer-events-none opacity-60" : ""}`}
                aria-disabled={isHomepage}
                tabIndex={isHomepage ? -1 : undefined}
                {...templateField}
                onChange={(event) => {
                  if (isHomepage) {
                    event.currentTarget.value = page?.template ?? "home";
                    return;
                  }
                  const nextTemplate = event.currentTarget.value;
                  void templateField.onChange(event);
                  if (mode !== "create") return;

                  if (nextTemplate === "home") {
                    form.setValue("slug", "home", { shouldDirty: true });
                    form.setValue("category", "info", { shouldDirty: true });
                    form.setValue("isActive", true, { shouldDirty: true });
                  } else if (form.getValues("slug") === "home") {
                    form.setValue("slug", "", { shouldDirty: true });
                  }
                }}
              >
                {CMS_PAGE_TEMPLATES.filter(
                  (value) => value !== "home" || mode === "create" || isHomepage
                ).map((value) => (
                  <option key={value} value={value}>
                    {t(
                      value === "home"
                        ? "templateHome"
                        : value === "about"
                          ? "templateAbout"
                          : "templateDefault"
                    )}
                  </option>
                ))}
              </select>
            </div>
            <ToggleField
              control={form.control}
              name="isActive"
              label={t("isActive")}
              disabled={homepageClassificationLocked}
            />
          </fieldset>

          <details className="group rounded-xl border border-gray-200">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-black text-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-primary group-open:rounded-b-none [&::-webkit-details-marker]:hidden">
              <span className="text-balance">{t("seo")}</span>
              <span aria-hidden="true">
                <ChevronLeftIcon className="-rotate-90 group-open:rotate-90" />
              </span>
            </summary>
            <fieldset className="grid gap-4 border-t border-gray-200 p-4 md:grid-cols-2">
              <legend className="sr-only">{t("seo")}</legend>
              <Controller
                name="seoTitleAr"
                control={form.control}
                render={({ field }) => (
                  <div>
                    <AdminInput
                      {...field}
                      value={field.value ?? ""}
                      maxLength={60}
                      label={t("seoTitleAr")}
                      dir="rtl"
                    />
                    <p className="mt-1 text-end text-xs text-gray-400" aria-live="polite">
                      {(field.value ?? "").length}/60
                    </p>
                  </div>
                )}
              />
              <Controller
                name="seoTitleEn"
                control={form.control}
                render={({ field }) => (
                  <div>
                    <AdminInput
                      {...field}
                      value={field.value ?? ""}
                      maxLength={60}
                      label={t("seoTitleEn")}
                      dir="ltr"
                    />
                    <p className="mt-1 text-end text-xs text-gray-400" aria-live="polite">
                      {(field.value ?? "").length}/60
                    </p>
                  </div>
                )}
              />
              <Controller
                name="seoDescriptionAr"
                control={form.control}
                render={({ field }) => (
                  <AdminTextArea
                    {...field}
                    value={field.value ?? ""}
                    maxLength={160}
                    showCount
                    rows={3}
                    label={t("seoDescriptionAr")}
                    dir="rtl"
                  />
                )}
              />
              <Controller
                name="seoDescriptionEn"
                control={form.control}
                render={({ field }) => (
                  <AdminTextArea
                    {...field}
                    value={field.value ?? ""}
                    maxLength={160}
                    showCount
                    rows={3}
                    label={t("seoDescriptionEn")}
                    dir="ltr"
                  />
                )}
              />
              <Controller
                name="seoImageAssetId"
                control={form.control}
                render={({ field }) => (
                  <SeoImagePicker
                    value={field.value ?? null}
                    onChange={field.onChange}
                    pageId={page?.id}
                    uploadToken={uploadToken}
                    onUploadingChange={setIsMediaUploading}
                    label={t("seoImageAssetId")}
                    uploadLabel={t("uploadSeoImage")}
                    libraryLabel={t("chooseSeoImage")}
                    canDelete={canDelete}
                    deleteLabel={t("deleteUnusedAsset")}
                    deleteError={t("deleteAssetError")}
                    uploadError={t("uploadAssetError")}
                  />
                )}
              />
              <ToggleField control={form.control} name="isIndexable" label={t("isIndexable")} />
            </fieldset>
          </details>
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">
              {error}
            </p>
          )}
        </form>
      )}
    </AdminDialog>
  );
}

function SeoImagePicker({
  value,
  onChange,
  pageId,
  uploadToken,
  onUploadingChange,
  label,
  uploadLabel,
  libraryLabel,
  canDelete,
  deleteLabel,
  deleteError,
  uploadError,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  pageId?: string;
  uploadToken: string;
  onUploadingChange: (isUploading: boolean) => void;
  label: string;
  uploadLabel: string;
  libraryLabel: string;
  canDelete: boolean;
  deleteLabel: string;
  deleteError: string;
  uploadError: string;
}) {
  const media = useAdminMediaAssets({ type: "image", limit: 50 });
  const upload = useAdminMediaUpload();
  const remove = useAdminMediaDelete();
  const isReportedUploading = useRef(false);
  const isMounted = useRef(true);
  const [stagedAsset, setStagedAsset] = useState<CmsMediaAsset | null>(null);
  const [error, setError] = useState("");
  const asset =
    stagedAsset?.id === value
      ? stagedAsset
      : media.data?.data.find((candidate) => candidate.id === value);
  const isStagedAssetOutsideLibrary =
    stagedAsset !== null && !media.data?.data.some((candidate) => candidate.id === stagedAsset.id);

  const reportUploading = useCallback(
    (nextIsUploading: boolean) => {
      if (isReportedUploading.current === nextIsUploading) return;
      isReportedUploading.current = nextIsUploading;
      onUploadingChange(nextIsUploading);
    },
    [onUploadingChange]
  );

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <select
        className={selectClass}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">{libraryLabel}</option>
        {isStagedAssetOutsideLibrary && (
          <option value={stagedAsset.id}>{stagedAsset.filename || stagedAsset.id}</option>
        )}
        {media.data?.data.map((item) => (
          <option key={item.id} value={item.id}>
            {item.filename || item.id}
          </option>
        ))}
      </select>
      <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-admin-primary">
        {upload.isPending ? "…" : uploadLabel}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={upload.isPending}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setError("");
            reportUploading(true);
            try {
              const uploaded = await upload.mutateAsync({ file, pageId, uploadToken });
              if (!isMounted.current) return;
              setStagedAsset(uploaded);
              onChange(uploaded.id);
            } catch {
              if (isMounted.current) setError(uploadError);
            } finally {
              if (isMounted.current) {
                reportUploading(false);
                event.target.value = "";
              }
            }
          }}
        />
      </label>
      {asset?.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={asset.url} alt="" className="mt-3 h-24 w-full rounded-lg object-cover" />
      )}
      {canDelete && asset && canDeleteCmsMediaAsset(asset) && (
        <button
          type="button"
          className="mt-2 text-xs font-bold text-red-700 underline underline-offset-4"
          disabled={remove.isPending}
          onClick={async () => {
            setError("");
            try {
              await remove.mutateAsync(asset.id);
              onChange(null);
              await media.refetch();
            } catch {
              setError(deleteError);
            }
          }}
        >
          {deleteLabel}
        </button>
      )}
      {error && <p className="mt-2 text-xs font-bold text-red-700">{error}</p>}
    </div>
  );
}

function ToggleField({
  control,
  name,
  label,
  disabled,
}: {
  control: Control<CmsPageFormData>;
  name: "isActive" | "isIndexable";
  label: string;
  disabled?: boolean;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <label className="flex items-center gap-3 self-end py-2 text-sm font-bold text-gray-700">
          <input
            type="checkbox"
            checked={field.value}
            onChange={field.onChange}
            disabled={disabled}
            className="h-5 w-5 accent-[#3459a5]"
          />
          {label}
        </label>
      )}
    />
  );
}
