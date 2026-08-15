"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AdminDialog } from "@/components/ui/admin/AdminDialog";
import { AdminInput } from "@/components/ui/admin/AdminInput";
import {
  useCmsSectionCreate,
  useCmsSectionUpdate,
  useCmsSectionDelete,
} from "@/features/admin/cms/hooks/useCmsSectionMutate";
import { useCmsSectionDetail, type CmsSection } from "@/features/admin/cms/hooks/useCmsSections";
import {
  cmsSectionEditorSchema,
  type CmsAssetsById,
  type CmsSectionContent,
} from "@/features/admin/cms/schemas/cms-section.schema";
import {
  CmsSectionContentEditor,
  getDefaultCmsSectionContent,
  getInitialCmsSectionContent,
} from "@/features/admin/cms/section-templates";
import { useUnsavedChanges } from "@/features/admin/cms/hooks/useUnsavedChanges";
import { TrashIcon } from "@/components/ui/shared/Icons";
import { Spinner } from "@/components/ui/shared/Spinner";
import { getApiErrorCode } from "@/lib/api-error-code";

type DialogMode = "create" | "edit";

type Props = {
  mode: DialogMode;
  pageId: string;
  section?: CmsSection;
  initialOrder?: number;
  onClose: () => void;
  canDelete?: boolean;
};

const labelClass = "block text-[11px] text-gray-400 uppercase tracking-[0.4px] mb-[6px]";

function getErrorStatus(error: unknown) {
  return (
    (error as { status?: number })?.status ??
    (error as { response?: { status?: number } })?.response?.status
  );
}

function getErrorCode(error: unknown) {
  const errorRecord = error as {
    data?: unknown;
    response?: { data?: unknown };
  };
  return getApiErrorCode(errorRecord?.data ?? errorRecord?.response?.data);
}

export function CmsSectionDialog({
  mode,
  pageId,
  section,
  initialOrder = 1,
  onClose,
  canDelete,
}: Props) {
  const sectionDialogTranslations = useTranslations("admin.cmsPage.sectionDialog");
  const hasExistingSection = mode === "edit" && !!section;
  const {
    data: sectionDetail,
    isLoading: isSectionDetailLoading,
    isError: isSectionDetailError,
  } = useCmsSectionDetail(pageId, hasExistingSection ? section.id : null);

  if (mode === "edit" && isSectionDetailLoading) {
    return (
      <AdminDialog title={sectionDialogTranslations("editTitle")} onClose={onClose} size="xl">
        <div className="min-h-[320px] rounded-[8px] border border-gray-200 bg-gray-50 flex items-center justify-center text-admin-primary">
          <Spinner />
        </div>
      </AdminDialog>
    );
  }

  if (mode === "edit" && isSectionDetailError) {
    return (
      <AdminDialog title={sectionDialogTranslations("editTitle")} onClose={onClose} size="xl">
        <div className="min-h-[220px] rounded-[8px] border border-danger-bg-alt bg-danger-bg flex items-center justify-center px-6 text-center">
          <p className="text-[13px] font-semibold text-danger-red">
            {sectionDialogTranslations("loadError")}
          </p>
        </div>
      </AdminDialog>
    );
  }

  const initialSection = sectionDetail?.section ?? section;

  return (
    <CmsSectionDialogForm
      key={
        mode === "edit"
          ? `${initialSection?.id ?? "edit"}-${sectionDetail ? "detail" : "summary"}`
          : "create"
      }
      mode={mode}
      pageId={pageId}
      section={initialSection}
      initialOrder={initialOrder}
      initialContent={
        mode === "edit"
          ? getInitialCmsSectionContent(initialSection?.content)
          : getDefaultCmsSectionContent()
      }
      initialAssetsById={sectionDetail?.assetsById ?? {}}
      onClose={onClose}
      canDelete={canDelete}
    />
  );
}

type FormProps = Props & {
  initialContent: CmsSectionContent;
  initialAssetsById: CmsAssetsById;
};

function CmsSectionDialogForm({
  mode,
  pageId,
  section,
  initialOrder = 1,
  initialContent,
  initialAssetsById,
  onClose,
  canDelete = true,
}: FormProps) {
  const sectionDialogTranslations = useTranslations("admin.cmsPage.sectionDialog");
  const validationTranslations = useTranslations("validation");
  const autoConvertMessages = {
    numbersOnlyDual: validationTranslations("numbersOnlyDual"),
    textArabicOnlyDual: validationTranslations("textArabicOnlyDual"),
    textEnglishOnlyDual: validationTranslations("textEnglishOnlyDual"),
    emailEnglishOnlyDual: validationTranslations("emailEnglishOnlyDual"),
    emailInvalidFormatDual: validationTranslations("emailInvalidFormatDual"),
    urlEnglishOnlyDual: validationTranslations("urlEnglishOnlyDual"),
    urlInvalidFormatDual: validationTranslations("urlInvalidFormatDual"),
  };

  const hasExistingSection = mode === "edit" && !!section;

  const [content, setContent] = useState<CmsSectionContent>(initialContent);
  const [uploadToken] = useState(() => crypto.randomUUID());
  const [isUploading, setIsUploading] = useState(false);
  const [assetsById, setAssetsById] = useState<CmsAssetsById>(initialAssetsById);
  const [titleAr, setTitleAr] = useState(() => (hasExistingSection ? (section.titleAr ?? "") : ""));
  const [titleEn, setTitleEn] = useState(() => (hasExistingSection ? (section.titleEn ?? "") : ""));
  const [isActive, setIsActive] = useState(() =>
    hasExistingSection ? (section.isActive ?? true) : true
  );

  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [areInternalLinksValid, setAreInternalLinksValid] = useState(true);

  const createMutation = useCmsSectionCreate(pageId);
  const updateMutation = useCmsSectionUpdate(pageId);
  const deleteMutation = useCmsSectionDelete(pageId);
  const isPending =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const isDirty =
    titleAr !== (hasExistingSection ? (section.titleAr ?? "") : "") ||
    titleEn !== (hasExistingSection ? (section.titleEn ?? "") : "") ||
    isActive !== (hasExistingSection ? section.isActive : true) ||
    JSON.stringify(content) !== JSON.stringify(initialContent);
  useUnsavedChanges(isDirty, sectionDialogTranslations("unsavedWarning"));

  function guardedClose() {
    if (isDirty && !window.confirm(sectionDialogTranslations("unsavedWarning"))) return;
    onClose();
  }

  const rawPayload = {
    titleAr,
    titleEn,
    content,
    isActive,
  };
  const payloadIsValid = cmsSectionEditorSchema.safeParse(rawPayload).success;
  const isFormValid =
    !!titleAr.trim() && !!titleEn.trim() && payloadIsValid && areInternalLinksValid;

  function handleSubmit() {
    setError("");
    const parsed = cmsSectionEditorSchema.safeParse(rawPayload);
    if (!parsed.success) {
      setError(sectionDialogTranslations("validationError"));
      return;
    }

    const payload = { ...parsed.data, uploadToken };

    if (mode === "create") {
      createMutation.mutate(
        { ...payload, order: initialOrder },
        {
          onSuccess: onClose,
          onError: (err: unknown) => {
            const status = getErrorStatus(err);
            if (status === 409) {
              setError(
                sectionDialogTranslations(
                  getErrorCode(err) === "CMS_MEDIA_CONCURRENCY_CONFLICT"
                    ? "mediaConcurrencyConflict"
                    : "identifierConflict"
                )
              );
            } else setError(sectionDialogTranslations("saveError"));
          },
        }
      );
    } else {
      updateMutation.mutate(
        { sectionId: section!.id, payload },
        {
          onSuccess: onClose,
          onError: (err: unknown) => {
            const status = getErrorStatus(err);
            if (status === 409) {
              setError(
                sectionDialogTranslations(
                  getErrorCode(err) === "CMS_MEDIA_CONCURRENCY_CONFLICT"
                    ? "mediaConcurrencyConflict"
                    : "identifierConflict"
                )
              );
            } else setError(sectionDialogTranslations("saveError"));
          },
        }
      );
    }
  }

  function handleDelete() {
    deleteMutation.mutate(section!.id, {
      onSuccess: onClose,
      onError: () => setError(sectionDialogTranslations("deleteError")),
    });
  }

  const footer = (
    <>
      <div>
        {mode === "edit" && canDelete && !confirmDelete && (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 h-[38px] px-4 rounded-[8px] text-[13px] text-danger-red border border-danger-bg-alt hover:bg-danger-bg transition-colors cursor-pointer bg-white"
          >
            <TrashIcon />
            {sectionDialogTranslations("delete")}
          </button>
        )}
        {mode === "edit" && confirmDelete && (
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-danger-red">
              {sectionDialogTranslations("confirmDeleteMsg")}
            </span>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="h-[34px] px-3 rounded-[8px] text-[12px] bg-danger-red text-white hover:bg-danger-deep transition-colors cursor-pointer border-0 disabled:opacity-50"
            >
              {isPending ? "..." : sectionDialogTranslations("confirmDelete")}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="h-[34px] px-3 rounded-[8px] text-[12px] border border-gray-200 text-gray-500 hover:bg-gray-100 cursor-pointer bg-white"
            >
              {sectionDialogTranslations("cancel")}
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 h-[36px]">
        <button
          type="button"
          onClick={() => setIsActive((prev) => !prev)}
          aria-label={sectionDialogTranslations("isActive")}
          aria-pressed={isActive}
          className={[
            "relative w-[48px] h-[26px] rounded-full overflow-hidden transition-colors flex-shrink-0 border-0 cursor-pointer",
            isActive ? "bg-admin-primary" : "bg-gray-300",
          ].join(" ")}
        >
          <span
            className={[
              "absolute top-[3px] left-[3px] w-[20px] h-[20px] bg-white rounded-full shadow transition-transform duration-200",
              isActive ? "translate-x-[22px]" : "translate-x-0",
            ].join(" ")}
          />
        </button>
        <span className="text-[13px] text-gray-700">{sectionDialogTranslations("isActive")}</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={guardedClose}
          disabled={isPending}
          className="h-[38px] px-5 rounded-[8px] text-[13px] border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer bg-white disabled:opacity-50"
        >
          {sectionDialogTranslations("cancel")}
        </button>
        <button
          onClick={handleSubmit}
          disabled={isPending || isUploading || !isFormValid}
          className="h-[38px] px-5 rounded-[8px] text-[13px] bg-admin-primary text-white hover:bg-admin-primary-dark transition-colors cursor-pointer border-0 disabled:opacity-50 shadow-[0_4px_12px_rgba(52,89,165,0.3)]"
        >
          {isPending ? <Spinner /> : sectionDialogTranslations("save")}
        </button>
      </div>
    </>
  );

  return (
    <AdminDialog
      title={
        mode === "create"
          ? sectionDialogTranslations("addTitle")
          : sectionDialogTranslations("editTitle")
      }
      onClose={guardedClose}
      size="xl"
      footer={footer}
    >
      <div className="flex flex-col gap-5">
        {isActive && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-semibold text-amber-900">
            {sectionDialogTranslations("liveSaveNotice")}
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-danger-bg-alt bg-danger-bg px-4 py-3 text-[13px] font-semibold text-danger-red"
          >
            {error}
          </p>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{sectionDialogTranslations("titleAr")}</label>
            <AdminInput
              dir="rtl"
              variant="filter"
              className="h-[40px] rounded-[8px] px-3 text-[13px] text-gray-800 focus:shadow-none"
              textLanguage="arabic"
              autoConvertMessages={autoConvertMessages}
              value={titleAr}
              onChange={(event) => setTitleAr(event.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>{sectionDialogTranslations("titleEn")}</label>
            <AdminInput
              dir="ltr"
              variant="filter"
              className="h-[40px] rounded-[8px] px-3 text-[13px] text-gray-800 focus:shadow-none"
              textLanguage="english"
              autoConvertMessages={autoConvertMessages}
              value={titleEn}
              onChange={(event) => setTitleEn(event.target.value)}
            />
          </div>
        </div>

        <CmsSectionContentEditor
          pageId={pageId}
          sectionId={section?.id}
          uploadToken={uploadToken}
          content={content}
          assetsById={assetsById}
          onAssetUploaded={(asset) => setAssetsById((prev) => ({ ...prev, [asset.id]: asset }))}
          onChange={(nextContent) => {
            setContent(nextContent);
            setError("");
          }}
          autoConvertMessages={autoConvertMessages}
          canDeleteAssets={canDelete}
          onValidityChange={setAreInternalLinksValid}
          onUploadingChange={setIsUploading}
        />
      </div>
    </AdminDialog>
  );
}
