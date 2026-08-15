"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { AppLocale } from "@/i18n/config";
import {
  CONTACT_TOPICS,
  createContactFormSchema,
  type ContactFormValues,
  type ContactInquirySource,
  type ContactTopic,
  toContactInquiryPayload,
} from "@/features/public/contact/contact-form.schema";

export type ContactInquiryFormLabels = {
  fullName: string;
  organization: string;
  email: string;
  topic: string;
  message: string;
  submit: string;
  submitting: string;
  success: string;
  error: string;
  rateLimited: string;
  confidentiality: string;
  topics: Record<ContactTopic, string>;
  placeholders?: Partial<Record<"fullName" | "organization" | "email" | "message", string>>;
  validation?: {
    fullName: string;
    organization: string;
    email: string;
    topic: string;
    message: string;
  };
};

type SubmissionState = "idle" | "success" | "error" | "rate-limited";

export function ContactInquiryForm({
  source,
  locale,
  labels,
}: {
  source: ContactInquirySource;
  locale: AppLocale;
  labels: ContactInquiryFormLabels;
}) {
  const schema = useMemo(
    () => createContactFormSchema(source, labels.validation),
    [labels.validation, source]
  );
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      organization: "",
      email: "",
      topic: "",
      message: "",
      website: "",
    },
  });

  async function submit(values: ContactFormValues) {
    try {
      const response = await fetch("/api/contact-inquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(toContactInquiryPayload(source, locale, values)),
      });

      if (response.status === 429) {
        setSubmissionState("rate-limited");
        return;
      }
      if (!response.ok) {
        setSubmissionState("error");
        return;
      }

      setSubmissionState("success");
      reset();
    } catch {
      setSubmissionState("error");
    }
  }

  const fieldClassName =
    "ogc-form-field w-full border-b border-current/30 bg-transparent px-0 py-3 text-base transition-[border-color] focus:border-current";

  return (
    <form className="ogc-inquiry-form grid gap-6" onSubmit={handleSubmit(submit)} noValidate>
      <FormFieldError id="full-name-error" message={errors.fullName?.message}>
        <label htmlFor={`${source}-full-name`} className="ogc-form-label">
          {labels.fullName}
        </label>
        <input
          {...register("fullName")}
          id={`${source}-full-name`}
          autoComplete="name"
          placeholder={labels.placeholders?.fullName}
          maxLength={120}
          required
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={errors.fullName ? "full-name-error" : undefined}
          className={fieldClassName}
        />
      </FormFieldError>

      {source === "home" && (
        <FormFieldError id="organization-error" message={errors.organization?.message}>
          <label htmlFor="home-organization" className="ogc-form-label">
            {labels.organization}
          </label>
          <input
            {...register("organization")}
            id="home-organization"
            autoComplete="organization"
            placeholder={labels.placeholders?.organization}
            maxLength={160}
            aria-invalid={Boolean(errors.organization)}
            aria-describedby={errors.organization ? "organization-error" : undefined}
            className={fieldClassName}
          />
        </FormFieldError>
      )}

      <FormFieldError id="email-error" message={errors.email?.message}>
        <label htmlFor={`${source}-email`} className="ogc-form-label">
          {labels.email}
        </label>
        <input
          {...register("email")}
          id={`${source}-email`}
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          placeholder={labels.placeholders?.email}
          maxLength={254}
          required
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={fieldClassName}
        />
      </FormFieldError>

      {source === "home" && (
        <FormFieldError id="topic-error" message={errors.topic?.message}>
          <label htmlFor="home-topic" className="ogc-form-label">
            {labels.topic}
          </label>
          <select
            {...register("topic")}
            id="home-topic"
            required
            aria-invalid={Boolean(errors.topic)}
            aria-describedby={errors.topic ? "topic-error" : undefined}
            className={fieldClassName}
            defaultValue=""
          >
            <option value="" disabled>
              {labels.topic}
            </option>
            {CONTACT_TOPICS.map((topic) => (
              <option key={topic} value={topic}>
                {labels.topics[topic]}
              </option>
            ))}
          </select>
        </FormFieldError>
      )}

      <FormFieldError id="message-error" message={errors.message?.message}>
        <label htmlFor={`${source}-message`} className="ogc-form-label">
          {labels.message}
        </label>
        <textarea
          {...register("message")}
          id={`${source}-message`}
          rows={5}
          maxLength={4000}
          placeholder={labels.placeholders?.message}
          required
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : undefined}
          className={`${fieldClassName} resize-y`}
        />
      </FormFieldError>

      <div className="absolute start-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden>
        <label htmlFor={`${source}-website`}>Website</label>
        <input
          {...register("website")}
          id={`${source}-website`}
          type="text"
          autoComplete="off"
          tabIndex={-1}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="ogc-button ogc-button-primary min-h-12 justify-center disabled:cursor-wait disabled:opacity-60"
      >
        {isSubmitting ? labels.submitting : labels.submit}
      </button>
      {source === "home" && (
        <p className="text-xs leading-6 opacity-60">{labels.confidentiality}</p>
      )}

      {submissionState === "success" && <p role="status">{labels.success}</p>}
      {(submissionState === "error" || submissionState === "rate-limited") && (
        <p role="alert" className="text-red-300">
          {submissionState === "rate-limited" ? labels.rateLimited : labels.error}
        </p>
      )}
    </form>
  );
}

function FormFieldError({
  id,
  message,
  children,
}: {
  id: string;
  message?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1">
      {children}
      {message && (
        <p id={id} className="text-sm text-red-300">
          {message}
        </p>
      )}
    </div>
  );
}
