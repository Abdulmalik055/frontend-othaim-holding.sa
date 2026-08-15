"use client";

import { useState } from "react";
import type { GroupBase } from "react-select";
import { useLocale, useTranslations } from "next-intl";
import { AdminInput } from "@/components/ui/admin/AdminInput";
import { AdminSelect, type SelectOption } from "@/components/ui/admin/AdminSelect";
import type { CmsLinkPage } from "@/features/admin/cms/hooks/useCmsPages";
import type { CmsSectionItem } from "@/features/admin/cms/schemas/cms-section.schema";
import { CMS_PAGE_CATEGORIES, type CmsPageCategory } from "@/features/admin/cms/types";
import {
  CMS_LINK_DESTINATION_TYPES,
  composeCmsLinkHref,
  getCmsLinkDestinationType,
  getCmsLinkInputValue,
  getCmsPagePath,
  getEmptyCmsLinkHref,
  isSafeCmsHref,
  normalizeCmsLinkHref,
  type CmsLinkDestinationType,
} from "@/lib/cms-link";
import type { AutoConvertInvalidReason } from "@/lib/input-auto-convert";

type LinkValue = Extract<CmsSectionItem, { type: "link" }>["link"];
type AutoConvertMessages = Partial<Record<AutoConvertInvalidReason, string>>;

interface CmsPageSelectOption extends SelectOption {
  category: CmsPageCategory;
  path: string;
  primaryTitle: string;
  secondaryTitle: string;
}

interface Props {
  pageId: string;
  link: LinkValue;
  pages: CmsLinkPage[];
  isPagesLoading: boolean;
  isPagesError: boolean;
  onRetryPages: () => void;
  onChange: (link: LinkValue) => void;
  autoConvertMessages: AutoConvertMessages;
}

const inputClass = "h-[42px] rounded-[10px] px-3 text-[13px] text-gray-800";

export function CmsButtonItemFields({
  pageId,
  link,
  pages,
  isPagesLoading,
  isPagesError,
  onRetryPages,
  onChange,
  autoConvertMessages,
}: Props) {
  const locale = useLocale();
  const translations = useTranslations("admin.cmsPage.sectionDialog");
  const pageTranslations = useTranslations("admin.cmsPage.pageDialog");
  const [hasDestinationBlurred, setHasDestinationBlurred] = useState(false);
  const destinationType = getCmsLinkDestinationType(link.href);
  const eligiblePages = pages.filter((page) => page.id !== pageId);
  const pageOptions: CmsPageSelectOption[] = eligiblePages.map((page) => {
    const primaryTitle = locale === "ar" ? page.titleAr : page.titleEn;
    const secondaryTitle = locale === "ar" ? page.titleEn : page.titleAr;
    const path = getCmsPagePath(page);
    return {
      value: path,
      label: `${primaryTitle} ${secondaryTitle} ${path}`,
      category: page.category,
      path,
      primaryTitle,
      secondaryTitle,
    };
  });
  const pageOptionGroups: GroupBase<SelectOption>[] = CMS_PAGE_CATEGORIES.flatMap((category) => {
    const options = pageOptions.filter((option) => option.category === category);

    if (options.length === 0) return [];

    return [
      {
        label: pageTranslations(category === "legal" ? "categoryLegal" : "categoryInfo"),
        options,
      },
    ];
  });
  const selectedPageOption = pageOptions.find((option) => option.value === link.href);
  const isUnavailableInternalHref =
    destinationType === "internal" &&
    Boolean(link.href) &&
    !isPagesLoading &&
    !isPagesError &&
    !selectedPageOption;
  const unavailableOption = isUnavailableInternalHref
    ? { value: link.href, label: `${translations("linkUnavailable")} · ${link.href}` }
    : undefined;
  const typeOptions: SelectOption[] = CMS_LINK_DESTINATION_TYPES.map((type) => ({
    value: type,
    label: translations(linkTypeMessageKey(type)),
  }));
  const selectedType = typeOptions.find((option) => option.value === destinationType);

  function updateField<Key extends keyof LinkValue>(key: Key, value: LinkValue[Key]) {
    onChange({ ...link, [key]: value });
  }

  function changeDestinationType(option: SelectOption | null) {
    if (!option) return;
    const nextType = option.value as CmsLinkDestinationType;
    if (nextType === destinationType) return;
    setHasDestinationBlurred(false);
    updateField("href", getEmptyCmsLinkHref(nextType));
  }

  function updateDestinationInput(value: string) {
    updateField("href", composeCmsLinkHref(destinationType, value));
  }

  function normalizeDestinationInput(value: string) {
    setHasDestinationBlurred(true);
    updateField("href", normalizeCmsLinkHref(destinationType, value));
  }

  const destinationInputValue = getCmsLinkInputValue(link.href, destinationType);
  const phoneError =
    destinationType === "phone" && hasDestinationBlurred && !isSafeCmsHref(link.href)
      ? translations("linkInvalidPhone")
      : undefined;

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <AdminInput
          label={translations("linkLabelAr")}
          name="buttonLabelAr"
          dir="rtl"
          variant="filter"
          className={inputClass}
          textLanguage="arabic"
          autoConvertMessages={autoConvertMessages}
          autoComplete="off"
          value={link.labelAr}
          onChange={(event) => updateField("labelAr", event.target.value)}
        />
        <AdminInput
          label={translations("linkLabelEn")}
          name="buttonLabelEn"
          dir="ltr"
          variant="filter"
          className={inputClass}
          textLanguage="english"
          autoConvertMessages={autoConvertMessages}
          autoComplete="off"
          value={link.labelEn}
          onChange={(event) => updateField("labelEn", event.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[minmax(150px,0.36fr)_minmax(0,1fr)]">
        <AdminSelect
          label={translations("linkType")}
          name="buttonLinkType"
          variant="filter"
          options={typeOptions}
          value={selectedType}
          isSearchable={false}
          onChange={(option) => changeDestinationType(option as SelectOption | null)}
        />

        {destinationType === "internal" ? (
          <div className="min-w-0" aria-live="polite">
            <AdminSelect
              label={translations("linkHref")}
              name="buttonInternalPage"
              variant="filter"
              options={
                unavailableOption ? [unavailableOption, ...pageOptionGroups] : pageOptionGroups
              }
              value={selectedPageOption ?? unavailableOption ?? null}
              isLoading={isPagesLoading}
              isDisabled={isPagesLoading || isPagesError}
              isOptionDisabled={(option) => option.value === unavailableOption?.value}
              placeholder={translations(isPagesLoading ? "linkLoadingPages" : "linkSelectPage")}
              loadingMessage={() => translations("linkLoadingPages")}
              noOptionsMessage={() => translations("linkNoPages")}
              maxMenuHeight={300}
              classNames={{
                menu: () =>
                  "mt-1 overflow-hidden rounded-[10px] border border-gray-200 bg-white shadow-[0_12px_30px_rgba(32,53,96,0.16)]",
                menuList: () => "py-0",
                group: () => "border-t border-gray-200 bg-white first:border-t-0",
                groupHeading: () =>
                  "bg-admin-primary-deep px-4 py-2.5 text-[11px] font-black text-white",
                option: ({ isSelected, isFocused }) =>
                  [
                    "border-t border-gray-100 px-4 py-3 text-[13px] transition-colors first:border-t-0",
                    isSelected
                      ? "bg-admin-primary-tint text-ink"
                      : isFocused
                        ? "bg-admin-primary-bg text-ink"
                        : "bg-white text-ink",
                  ].join(" "),
              }}
              formatGroupLabel={(group) => (
                <div className="flex items-center justify-between gap-3">
                  <span>{group.label}</span>
                  <span className="rounded-full bg-white px-2.5 py-px text-[10px] font-black text-admin-primary-deep shadow-sm">
                    {group.options.length}
                  </span>
                </div>
              )}
              formatOptionLabel={(option, { context }) => {
                if (!("path" in option)) return option.label;

                const pageOption = option as CmsPageSelectOption;
                if (context === "value") {
                  return (
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate">{pageOption.primaryTitle}</span>
                      <span aria-hidden="true" className="text-gray-400">
                        ·
                      </span>
                      <span dir="ltr" className="shrink-0 font-mono text-[11px] text-gray-500">
                        {pageOption.path}
                      </span>
                    </span>
                  );
                }

                return (
                  <div className="min-w-0">
                    <span className="block truncate font-bold leading-5 text-gray-900">
                      {pageOption.primaryTitle}
                    </span>
                    <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] leading-4 text-gray-500">
                      <span className="truncate">{pageOption.secondaryTitle}</span>
                      <span aria-hidden="true">·</span>
                      <span dir="ltr" className="shrink-0 font-mono">
                        {pageOption.path}
                      </span>
                    </span>
                  </div>
                );
              }}
              error={
                isUnavailableInternalHref
                  ? translations("linkUnavailable")
                  : isPagesError
                    ? translations("linkPagesError")
                    : undefined
              }
              onChange={(option) =>
                updateField("href", (option as SelectOption | null)?.value ?? "")
              }
            />
            {isPagesError && (
              <button
                type="button"
                onClick={onRetryPages}
                className="mt-2 rounded-md border-0 bg-transparent p-0 text-xs font-semibold text-admin-primary underline underline-offset-4 hover:text-admin-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary"
              >
                {translations("linkRetryPages")}
              </button>
            )}
          </div>
        ) : (
          <div className="min-w-0" aria-live="polite">
            <AdminInput
              label={translations("linkHref")}
              name="buttonLinkDestination"
              dir="ltr"
              variant="filter"
              className={[
                inputClass,
                destinationType === "email"
                  ? "!ps-[72px]"
                  : destinationType === "phone"
                    ? "!ps-[52px]"
                    : "",
              ].join(" ")}
              type={inputType(destinationType)}
              inputMode={destinationType === "phone" ? "tel" : undefined}
              autoConvertMode={destinationType === "phone" ? "none" : undefined}
              autoHttps={false}
              autoConvertMessages={autoConvertMessages}
              autoComplete="off"
              spellCheck={false}
              required
              startIcon={
                destinationType === "email" || destinationType === "phone" ? (
                  <span
                    translate="no"
                    className="whitespace-nowrap font-mono text-[11px] font-semibold"
                  >
                    {destinationType === "email" ? "mailto:" : "tel:"}
                  </span>
                ) : undefined
              }
              placeholder={translations(destinationPlaceholderMessageKey(destinationType))}
              error={phoneError}
              value={destinationInputValue}
              onChange={(event) => updateDestinationInput(event.target.value)}
              onBlur={(event) => normalizeDestinationInput(event.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function linkTypeMessageKey(type: CmsLinkDestinationType) {
  if (type === "url") return "linkTypeUrl";
  if (type === "email") return "linkTypeEmail";
  if (type === "phone") return "linkTypePhone";
  return "linkTypeInternal";
}

function destinationPlaceholderMessageKey(type: Exclude<CmsLinkDestinationType, "internal">) {
  if (type === "email") return "linkEmailPlaceholder";
  if (type === "phone") return "linkPhonePlaceholder";
  return "linkUrlPlaceholder";
}

function inputType(type: Exclude<CmsLinkDestinationType, "internal">) {
  if (type === "email") return "email";
  if (type === "phone") return "tel";
  return "url";
}
