"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AdminInput } from "@/components/ui/admin/AdminInput";
import { AdminButton } from "@/components/ui/admin/AdminButton";
import { loginSchema, type LoginFormData } from "../schemas/auth.schema";
import { useAuth } from "../hooks/useAuth";
import { useAuthStore } from "@/stores/useAuthStore";
import { apiClient, ApiError } from "@/lib/api-client";
import {
  resolvePreferredLanguageFromUser,
  setLanguagePreferenceCookie,
  type AppLanguage,
} from "@/lib/language-preference";
import type { AdminPermissionsResponse } from "@/types";
import { PlatformIdentity } from "@/features/platform/components/PlatformIdentity";

type Props = {
  locale: string;
  onForgot: () => void;
  onMustChange: () => void;
};

const EmailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const SignInIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

export function LoginForm({ locale, onForgot, onMustChange }: Props) {
  const translations = useTranslations("auth");
  const commonValidationT = useTranslations("validation");
  const router = useRouter();
  const { login, loginWithGoogle, getRedirectDestination, sendVerificationOTP } = useAuth();
  const { setPermissions } = useAuthStore();
  const [serverError, setServerError] = useState<string | null>(null);
  const fallbackLocale: AppLanguage = locale === "en" ? "en" : "ar";
  const autoConvertMessages = {
    emailEnglishOnlyDual: commonValidationT("emailEnglishOnlyDual"),
    emailInvalidFormatDual: commonValidationT("emailInvalidFormatDual"),
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData, event?: React.BaseSyntheticEvent) {
    const formElement = event?.currentTarget as HTMLFormElement | undefined;
    const autoInvalidInput = formElement?.querySelector<HTMLInputElement>(
      '[data-auto-convert-invalid="true"]'
    );
    if (autoInvalidInput) {
      const reason = autoInvalidInput.dataset.autoConvertInvalidReason as
        | keyof typeof autoConvertMessages
        | "emailInvalidFormatDual"
        | undefined;
      if (reason && reason in autoConvertMessages) {
        setServerError(autoConvertMessages[reason as keyof typeof autoConvertMessages]);
      } else if (reason === "emailInvalidFormatDual") {
        setServerError(commonValidationT("emailInvalidFormatDual"));
      } else {
        setServerError(commonValidationT("emailEnglishOnlyDual"));
      }
      return;
    }

    setServerError(null);
    try {
      await login(data.email, data.password, data.rememberMe);
      const freshUser = useAuthStore.getState().user;
      const preferredLocale = resolvePreferredLanguageFromUser(freshUser, fallbackLocale);
      setLanguagePreferenceCookie(preferredLocale);
      const mustChange = (freshUser as Record<string, unknown> | null)?.mustChangePassword;
      if (mustChange) {
        if (preferredLocale !== fallbackLocale) {
          router.replace(`/${preferredLocale}/auth/login?mustChange=true`);
          return;
        }
        onMustChange();
        return;
      }
      const permResult = await apiClient.get<AdminPermissionsResponse>(
        "/api/admin/auth/permissions"
      );
      if (!permResult.data.isAdmin) {
        router.replace(`/${preferredLocale}/auth/login`);
        return;
      }
      setPermissions(permResult.data.permissions);
      router.replace(getRedirectDestination(preferredLocale));
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        const freshUser = useAuthStore.getState().user;
        const preferredLocale = resolvePreferredLanguageFromUser(freshUser, fallbackLocale);
        setLanguagePreferenceCookie(preferredLocale);
        router.replace(`/${preferredLocale}/auth/login`);
        return;
      }
      const message = err instanceof Error ? err.message : "Unknown error";
      if (message.toLowerCase().includes("email") && message.toLowerCase().includes("verif")) {
        try {
          await sendVerificationOTP(data.email);
        } catch {
          // proceed to verify page even if resend fails
        }
        router.replace(`/${locale}/auth/verify-email?email=${encodeURIComponent(data.email)}`);
        return;
      }
      setServerError(message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {/* Brand */}
      <div className="flex flex-col items-center gap-2 pb-1">
        <PlatformIdentity
          locale={locale}
          className="flex flex-col items-center gap-2"
          logoContainerClassName="flex h-[102px] w-[102px] items-center justify-center overflow-hidden rounded-[16px] border border-gray-100 bg-admin-primary shadow-[0_10px_24px_rgba(52,89,165,0.18)]"
          logoClassName="h-full w-full object-contain p-3"
          nameClassName="max-w-[280px] text-center text-[15px] font-bold text-gray-700"
        />
        <div className="text-center">
          <div className="text-[20px] font-black text-gray-900">{translations("welcomeBack")}</div>
          <div className="text-[13px] text-gray-500 mt-0.5">{translations("loginSub")}</div>
        </div>
      </div>

      {/* Fields */}
      <AdminInput
        type="email"
        label={translations("email")}
        placeholder={translations("emailPlaceholder")}
        startIcon={<EmailIcon />}
        autoConvertMessages={autoConvertMessages}
        error={errors.email?.message}
        {...register("email")}
      />

      <AdminInput
        type="password"
        label={translations("password")}
        placeholder={translations("passwordPlaceholder")}
        startIcon={<LockIcon />}
        error={errors.password?.message}
        {...register("password")}
      />

      {/* Form options */}
      <div className="flex items-center justify-between -mt-1">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 accent-admin-primary"
            {...register("rememberMe")}
          />
          <span className="text-[13px] text-gray-600">{translations("rememberMe")}</span>
        </label>
        <button
          type="button"
          onClick={onForgot}
          className="text-[13px] text-admin-primary hover:underline font-semibold"
        >
          {translations("forgotPassword")}
        </button>
      </div>

      {/* Server error */}
      {serverError && (
        <p className="text-[13px] text-danger-red text-center -mt-2">{serverError}</p>
      )}

      {/* Submit */}
      <AdminButton type="submit" fullWidth loading={isSubmitting} startIcon={<SignInIcon />}>
        {translations("login")}
      </AdminButton>

      {/* Divider */}
      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-[12px] text-gray-400 whitespace-nowrap">
          {translations("orContinueWith")}
        </span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={() => loginWithGoogle(locale)}
        className="flex items-center justify-center gap-2.5 w-full h-[44px] border border-gray-200 rounded-[10px] text-[14px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <GoogleIcon />
        {translations("loginWithGoogle")}
      </button>
    </form>
  );
}
