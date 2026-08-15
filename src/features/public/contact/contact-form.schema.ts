import { z } from "zod";
import type { AppLocale } from "@/i18n/config";

export const CONTACT_TOPICS = [
  "partnership",
  "co_investment",
  "family_office",
  "media",
  "other",
] as const;

export type ContactInquirySource = "home" | "contact";
export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export type ContactFormValues = {
  fullName: string;
  organization: string;
  email: string;
  topic: ContactTopic | "";
  message: string;
  website: string;
};

export type ContactValidationMessages = {
  fullName?: string;
  organization?: string;
  email?: string;
  topic?: string;
  message?: string;
};

export type ContactInquiryPayload = {
  source: ContactInquirySource;
  locale: AppLocale;
  fullName: string;
  organization?: string;
  email: string;
  topic?: ContactTopic;
  message: string;
  website: string;
};

export function createContactFormSchema(
  source: ContactInquirySource,
  messages: ContactValidationMessages = {}
) {
  return z
    .object({
      fullName: z.string().trim().min(2, messages.fullName).max(120, messages.fullName),
      organization: z.string().trim().max(160, messages.organization),
      email: z.string().trim().email(messages.email).max(254, messages.email),
      topic: z.union([z.enum(CONTACT_TOPICS), z.literal("")]),
      message: z.string().trim().min(10, messages.message).max(4000, messages.message),
      website: z.string(),
    })
    .superRefine((values, context) => {
      if (source === "home" && !values.topic) {
        context.addIssue({
          code: "custom",
          path: ["topic"],
          message: messages.topic ?? "Select an inquiry topic",
        });
      }
    });
}

export function toContactInquiryPayload(
  source: ContactInquirySource,
  locale: AppLocale,
  values: ContactFormValues
): ContactInquiryPayload {
  const payload: ContactInquiryPayload = {
    source,
    locale,
    fullName: values.fullName.trim(),
    email: values.email.trim(),
    message: values.message.trim(),
    website: values.website,
  };

  if (source === "home") {
    const organization = values.organization.trim();
    if (organization) payload.organization = organization;
    if (values.topic) payload.topic = values.topic;
  }

  return payload;
}
