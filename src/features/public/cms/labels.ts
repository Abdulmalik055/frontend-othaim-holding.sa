import type { CmsPageRendererLabels } from "@/features/public/cms/CmsPageRenderer";

type CmsPageTranslationKey =
  | "legalCentre"
  | "insidePlatform"
  | "information"
  | "empty"
  | "form.fullName"
  | "form.organization"
  | "form.email"
  | "form.topic"
  | "form.message"
  | "form.placeholders.fullName"
  | "form.placeholders.organization"
  | "form.placeholders.email"
  | "form.placeholders.message"
  | "form.submit"
  | "form.submitting"
  | "form.success"
  | "form.error"
  | "form.rateLimited"
  | "form.confidentiality"
  | "form.topics.partnership"
  | "form.topics.coInvestment"
  | "form.topics.familyOffice"
  | "form.topics.media"
  | "form.topics.other"
  | "form.validation.fullName"
  | "form.validation.organization"
  | "form.validation.email"
  | "form.validation.topic"
  | "form.validation.message";

type CmsPageTranslations = ((key: CmsPageTranslationKey) => string) & {
  raw: (key: "lastUpdated") => unknown;
};

export function createCmsPageRendererLabels(t: CmsPageTranslations): CmsPageRendererLabels {
  return {
    legalCentre: t("legalCentre"),
    lastUpdated: String(t.raw("lastUpdated")),
    insidePlatform: t("insidePlatform"),
    information: t("information"),
    empty: t("empty"),
    formFullName: t("form.fullName"),
    formOrganization: t("form.organization"),
    formEmail: t("form.email"),
    formTopic: t("form.topic"),
    formMessage: t("form.message"),
    formFullNamePlaceholder: t("form.placeholders.fullName"),
    formOrganizationPlaceholder: t("form.placeholders.organization"),
    formEmailPlaceholder: t("form.placeholders.email"),
    formMessagePlaceholder: t("form.placeholders.message"),
    formSubmit: t("form.submit"),
    formSubmitting: t("form.submitting"),
    formSuccess: t("form.success"),
    formError: t("form.error"),
    formRateLimited: t("form.rateLimited"),
    formConfidentiality: t("form.confidentiality"),
    topicPartnership: t("form.topics.partnership"),
    topicCoInvestment: t("form.topics.coInvestment"),
    topicFamilyOffice: t("form.topics.familyOffice"),
    topicMedia: t("form.topics.media"),
    topicOther: t("form.topics.other"),
    validationFullName: t("form.validation.fullName"),
    validationOrganization: t("form.validation.organization"),
    validationEmail: t("form.validation.email"),
    validationTopic: t("form.validation.topic"),
    validationMessage: t("form.validation.message"),
  };
}
