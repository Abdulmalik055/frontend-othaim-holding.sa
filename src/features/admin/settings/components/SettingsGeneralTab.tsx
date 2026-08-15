"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { AdminInput } from "@/components/ui/admin/AdminInput";
import { AdminTextArea } from "@/components/ui/admin/AdminTextArea";
import { AdminButton } from "@/components/ui/admin/AdminButton";
import { getAutoConvertInvalidAttemptReason, normalizeEmail } from "@/lib/input-auto-convert";
import {
  collectAutoConvertInvalidIssues,
  formatAutoConvertIssueList,
} from "@/lib/auto-convert-feedback";
import { useAdminSettings } from "../hooks/useAdminSettings";
import { useAdminSettingsUpdate } from "../hooks/useAdminSettingsMutation";
import { PlatformLogoField } from "./PlatformLogoField";
import { getApiErrorCode } from "@/lib/api-error-code";
import {
  TwitterIcon,
  InstagramIcon,
  LinkedinIcon,
  FacebookIcon,
  WhatsappIcon,
  SnapchatIcon,
} from "@/components/ui/shared/Icons";

// ── Social platforms config ────────────────────────────────────────────────────
const SOCIAL_PLATFORM_KEYS = [
  "twitter",
  "instagram",
  "linkedin",
  "facebook",
  "whatsapp",
  "snapchat",
] as const;
type SocialPlatformKey = (typeof SOCIAL_PLATFORM_KEYS)[number];

function cleanSocialLinksMap(links: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(links).filter(([, value]) => value.trim().length > 0)
  ) as Record<string, string>;
}

const SOCIAL_PLATFORM_ICONS: Record<SocialPlatformKey, React.ReactNode> = {
  twitter: <TwitterIcon size={15} />,
  instagram: <InstagramIcon size={15} />,
  linkedin: <LinkedinIcon size={15} />,
  facebook: <FacebookIcon size={15} />,
  whatsapp: <WhatsappIcon size={15} />,
  snapchat: <SnapchatIcon size={15} />,
};

// ── Section wrapper ────────────────────────────────────────────────────────────
function SettingsSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-6 py-7 border-b border-surface-soft last:border-0">
      <div className="sm:w-[220px] shrink-0">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="w-7 h-7 rounded-[8px] bg-admin-primary-bg flex items-center justify-center text-admin-primary">
            {icon}
          </span>
          <p className="text-[14px] font-bold text-gray-900">{title}</p>
        </div>
        {description && (
          <p className="text-[12px] text-gray-400 leading-relaxed mt-1">{description}</p>
        )}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────
function IconText() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  );
}
function IconImage() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}
function IconMapPin() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function IconShare() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────
export function SettingsGeneralTab() {
  const generalTabTranslations = useTranslations("admin.settingsPage.general");
  const validationTranslations = useTranslations("validation");
  const { data, isLoading } = useAdminSettings();
  const update = useAdminSettingsUpdate();
  const [uploadToken] = useState(() => crypto.randomUUID());
  const autoConvertMessages = {
    numbersOnlyDual: validationTranslations("numbersOnlyDual"),
    textArabicOnlyDual: validationTranslations("textArabicOnlyDual"),
    textEnglishOnlyDual: validationTranslations("textEnglishOnlyDual"),
    emailEnglishOnlyDual: validationTranslations("emailEnglishOnlyDual"),
    emailInvalidFormatDual: validationTranslations("emailInvalidFormatDual"),
    urlEnglishOnlyDual: validationTranslations("urlEnglishOnlyDual"),
    urlInvalidFormatDual: validationTranslations("urlInvalidFormatDual"),
  };

  const [form, setForm] = useState({
    nameAr: "",
    nameEn: "",
    bioAr: "",
    bioEn: "",
    email: "",
    phone: "",
    addressAr: "",
    addressEn: "",
    workingHoursAr: "",
    workingHoursEn: "",
  });
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [logoAssetId, setLogoAssetId] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [openSocials, setOpenSocials] = useState<Set<string>>(new Set());
  const [success, setSuccess] = useState(false);
  const [saveError, setSaveError] = useState<"" | "mediaConcurrencyConflict" | "saveError">("");
  const [emailFieldError, setEmailFieldError] = useState("");
  const [submitValidationErrors, setSubmitValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        nameAr: data.nameAr ?? "",
        nameEn: data.nameEn ?? "",
        bioAr: data.bioAr ?? "",
        bioEn: data.bioEn ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        addressAr: data.addressAr ?? "",
        addressEn: data.addressEn ?? "",
        workingHoursAr: data.workingHoursAr ?? "",
        workingHoursEn: data.workingHoursEn ?? "",
      });
      const saved = cleanSocialLinksMap(data.socialLinks ?? {});
      setSocialLinks(saved);
      setLogoAssetId(data.logoAssetId ?? null);
      setLogoUrl(data.logoUrl ?? null);
      // auto-open platforms that already have a saved value
      setOpenSocials(new Set(Object.keys(saved).filter((key) => saved[key])));
    }
  }, [data]);

  function set(key: keyof typeof form, value: string) {
    setForm((prevForm) => ({ ...prevForm, [key]: value }));
    if (key === "email") setEmailFieldError("");
    setSubmitValidationErrors([]);
    setSuccess(false);
  }

  function setSocial(platform: string, value: string) {
    setSocialLinks((prev) => {
      const next = { ...prev };
      if (value.trim().length === 0) {
        delete next[platform];
        return next;
      }
      next[platform] = value;
      return next;
    });
    setSubmitValidationErrors([]);
    setSuccess(false);
  }

  function toggleSocial(platform: string) {
    setOpenSocials((prev) => {
      const next = new Set(prev);
      if (next.has(platform)) {
        next.delete(platform);
      } else {
        next.add(platform);
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (logoUploading) return;
    setSubmitValidationErrors([]);
    setSaveError("");

    const autoConvertIssues = collectAutoConvertInvalidIssues(e.currentTarget);
    const normalizedEmail = normalizeEmail(form.email);
    const emailInvalidReason = normalizedEmail
      ? getAutoConvertInvalidAttemptReason("email", form.email, normalizedEmail)
      : null;
    const nextEmailError = emailInvalidReason ? validationTranslations(emailInvalidReason) : "";
    setEmailFieldError(nextEmailError);

    const allReasons = Array.from(
      new Set([...(emailInvalidReason ? [emailInvalidReason] : []), ...autoConvertIssues.reasons])
    );
    if (allReasons.length > 0) {
      setSubmitValidationErrors(formatAutoConvertIssueList(allReasons, validationTranslations));
      autoConvertIssues.firstInvalidField?.scrollIntoView({ behavior: "smooth", block: "center" });
      autoConvertIssues.firstInvalidField?.focus();
      return;
    }

    try {
      await update.mutateAsync({
        ...form,
        logoAssetId,
        uploadToken,
        socialLinks: cleanSocialLinksMap(socialLinks),
      });
      setSuccess(true);
    } catch (error) {
      setSuccess(false);
      const errorRecord = error as {
        status?: number;
        data?: unknown;
        response?: { status?: number; data?: unknown };
      };
      const status = errorRecord?.status ?? errorRecord?.response?.status;
      const code = getApiErrorCode(errorRecord?.data ?? errorRecord?.response?.data);
      setSaveError(
        status === 409 &&
          (code === "CMS_MEDIA_CONCURRENCY_CONFLICT" || code === "CMS_SETTINGS_CONFLICT")
          ? "mediaConcurrencyConflict"
          : "saveError"
      );
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin h-8 w-8 border-2 border-admin-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Platform name */}
      <SettingsSection icon={<IconText />} title={generalTabTranslations("platformName")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AdminInput
            label={generalTabTranslations("nameAr")}
            value={form.nameAr}
            onChange={(e) => set("nameAr", e.target.value)}
            dir="rtl"
            textLanguage="arabic"
            autoConvertMessages={autoConvertMessages}
          />
          <AdminInput
            label={generalTabTranslations("nameEn")}
            value={form.nameEn}
            onChange={(e) => set("nameEn", e.target.value)}
            dir="ltr"
            textLanguage="english"
            autoConvertMessages={autoConvertMessages}
          />
        </div>
      </SettingsSection>

      {/* Platform logo */}
      <SettingsSection
        icon={<IconImage />}
        title={generalTabTranslations("platformLogo")}
        description={generalTabTranslations("platformLogoDescription")}
      >
        <PlatformLogoField
          uploadToken={uploadToken}
          logoAssetId={logoAssetId}
          logoUrl={logoUrl}
          onChange={(nextLogo) => {
            setLogoAssetId(nextLogo.logoAssetId);
            setLogoUrl(nextLogo.logoUrl);
            setSubmitValidationErrors([]);
            setSuccess(false);
          }}
          onUploadingChange={setLogoUploading}
        />
      </SettingsSection>

      {/* Bio */}
      <SettingsSection icon={<IconText />} title={generalTabTranslations("bio")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AdminTextArea
            label={generalTabTranslations("bioAr")}
            value={form.bioAr}
            onChange={(e) => set("bioAr", e.target.value)}
            rows={4}
            dir="rtl"
            textLanguage="arabic"
            autoConvertMessages={autoConvertMessages}
          />
          <AdminTextArea
            label={generalTabTranslations("bioEn")}
            value={form.bioEn}
            onChange={(e) => set("bioEn", e.target.value)}
            rows={4}
            dir="ltr"
            textLanguage="english"
            autoConvertMessages={autoConvertMessages}
          />
        </div>
      </SettingsSection>

      {/* Contact */}
      <SettingsSection icon={<IconMail />} title={generalTabTranslations("contact")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AdminInput
            label={generalTabTranslations("email")}
            type="email"
            autoConvertMessages={autoConvertMessages}
            error={emailFieldError || undefined}
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            dir="ltr"
          />
          <AdminInput
            label={generalTabTranslations("phone")}
            type="number"
            inputMode="numeric"
            hideNumberControls
            autoConvertMessages={autoConvertMessages}
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            dir="ltr"
          />
        </div>
      </SettingsSection>

      {/* Address */}
      <SettingsSection icon={<IconMapPin />} title={generalTabTranslations("address")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AdminInput
            label={generalTabTranslations("addressAr")}
            value={form.addressAr}
            onChange={(e) => set("addressAr", e.target.value)}
            dir="rtl"
            textLanguage="arabic"
            autoConvertMessages={autoConvertMessages}
          />
          <AdminInput
            label={generalTabTranslations("addressEn")}
            value={form.addressEn}
            onChange={(e) => set("addressEn", e.target.value)}
            dir="ltr"
            textLanguage="english"
            autoConvertMessages={autoConvertMessages}
          />
        </div>
      </SettingsSection>

      {/* Working hours */}
      <SettingsSection icon={<IconClock />} title={generalTabTranslations("workingHours")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AdminInput
            label={generalTabTranslations("workingHoursAr")}
            value={form.workingHoursAr}
            onChange={(e) => set("workingHoursAr", e.target.value)}
            dir="rtl"
            textLanguage="arabic"
            autoConvertMessages={autoConvertMessages}
          />
          <AdminInput
            label={generalTabTranslations("workingHoursEn")}
            value={form.workingHoursEn}
            onChange={(e) => set("workingHoursEn", e.target.value)}
            dir="ltr"
            textLanguage="english"
            autoConvertMessages={autoConvertMessages}
          />
        </div>
      </SettingsSection>

      {/* Social links */}
      <SettingsSection
        icon={<IconShare />}
        title={generalTabTranslations("socialLinks")}
        description={generalTabTranslations("socialLinksHint")}
      >
        <div className="flex flex-col gap-4">
          {/* Platform icon buttons */}
          <div className="flex flex-wrap gap-2">
            {SOCIAL_PLATFORM_KEYS.map((platformKey) => {
              const isOpen = openSocials.has(platformKey);
              const hasValue = !!socialLinks[platformKey]?.trim();
              return (
                <button
                  key={platformKey}
                  type="button"
                  onClick={() => toggleSocial(platformKey)}
                  title={generalTabTranslations(
                    `social_${platformKey}` as Parameters<typeof generalTabTranslations>[0]
                  )}
                  className={[
                    "flex items-center gap-2 px-3 h-[34px] rounded-[8px] border text-[12px] font-semibold transition-all cursor-pointer",
                    isOpen
                      ? "bg-admin-primary-bg border-admin-primary text-admin-primary"
                      : hasValue
                        ? "bg-success-bg border-green-300 text-success-alt"
                        : "bg-white border-gray-200 text-gray-500 hover:border-admin-primary hover:text-admin-primary",
                  ].join(" ")}
                >
                  {SOCIAL_PLATFORM_ICONS[platformKey]}
                  <span>
                    {generalTabTranslations(
                      `social_${platformKey}` as Parameters<typeof generalTabTranslations>[0]
                    )}
                  </span>
                  {hasValue && !isOpen && (
                    <span className="w-1.5 h-1.5 rounded-full bg-success-green shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Expanded inputs */}
          {SOCIAL_PLATFORM_KEYS.filter((platformKey) => openSocials.has(platformKey)).map(
            (platformKey) => (
              <div key={platformKey} className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-[8px] bg-admin-primary-bg flex items-center justify-center text-admin-primary shrink-0">
                  {SOCIAL_PLATFORM_ICONS[platformKey]}
                </span>
                <span className="text-[12px] font-semibold text-gray-700 w-[90px] shrink-0">
                  {generalTabTranslations(
                    `social_${platformKey}` as Parameters<typeof generalTabTranslations>[0]
                  )}
                </span>
                <div className="flex-1">
                  <AdminInput
                    type="url"
                    inputMode="url"
                    autoConvertMessages={autoConvertMessages}
                    value={socialLinks[platformKey] ?? ""}
                    onChange={(e) => setSocial(platformKey, e.target.value)}
                    placeholder={generalTabTranslations(
                      `social_${platformKey}_placeholder` as Parameters<
                        typeof generalTabTranslations
                      >[0]
                    )}
                    dir="ltr"
                  />
                </div>
              </div>
            )
          )}
        </div>
      </SettingsSection>

      {/* Footer actions */}
      <div className="flex items-center gap-4 pt-6">
        <AdminButton type="submit" loading={update.isPending} disabled={logoUploading}>
          {generalTabTranslations("save")}
        </AdminButton>
        {success && (
          <span className="text-[13px] text-success-emerald font-semibold">
            {generalTabTranslations("saveSuccess")}
          </span>
        )}
        {(saveError || update.isError) && (
          <span className="text-[13px] text-danger">
            {generalTabTranslations(saveError || "saveError")}
          </span>
        )}
      </div>
      {submitValidationErrors.length > 0 && (
        <div className="mt-3 rounded-[10px] border border-danger-bg-alt bg-danger-bg-faint px-3 py-2.5">
          <p className="text-[13px] font-semibold text-danger-red">
            {validationTranslations("checkFieldsBeforeSave")}
          </p>
          <ul className="mt-1 list-disc ps-5 text-[12px] text-danger-red space-y-0.5">
            {submitValidationErrors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
