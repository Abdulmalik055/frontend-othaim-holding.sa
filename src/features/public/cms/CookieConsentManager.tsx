"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AppLocale } from "@/i18n/config";
import type { CmsSectionItem } from "@/features/cms/content-contract";
import type { PublicCmsSection } from "@/features/public/cms/types";

export const COOKIE_CONSENT_COOKIE_NAME = "othaim-global.cookie-consent";
const COOKIE_CONSENT_VERSION = 1 as const;
const COOKIE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;
const OPTIONAL_CATEGORIES = ["functional", "analytics", "performance", "advertisement"] as const;

interface CookieConsentPreferences {
  version: typeof COOKIE_CONSENT_VERSION;
  necessary: true;
  functional: boolean;
  analytics: boolean;
  performance: boolean;
  advertisement: boolean;
  updatedAt: string;
}

interface CookieConsentContextValue {
  openSettings: (trigger: HTMLButtonElement) => void;
}

interface CookieConsentManagerProps {
  locale: AppLocale;
  section: PublicCmsSection;
  children: ReactNode;
}

interface CookieSettingsTriggerProps {
  label: string;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function CookieConsentManager({
  locale,
  section,
  children,
}: CookieConsentManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<CookieConsentPreferences>(createDefaultPreferences);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const content = useMemo(() => createConsentContent(section, locale), [section, locale]);

  const closeSettings = useCallback(() => {
    setIsOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const openSettings = useCallback((trigger: HTMLButtonElement) => {
    triggerRef.current = trigger;
    setDraft(readCookieConsent() ?? createDefaultPreferences());
    setIsOpen(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSettings();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeSettings, isOpen]);

  function savePreferences(next: CookieConsentPreferences) {
    writeCookieConsent(next);
    setDraft(next);
    closeSettings();
  }

  function saveAll(isAccepted: boolean) {
    savePreferences(
      createPreferences(
        Object.fromEntries(OPTIONAL_CATEGORIES.map((category) => [category, isAccepted])) as Record<
          (typeof OPTIONAL_CATEGORIES)[number],
          boolean
        >
      )
    );
  }

  return (
    <CookieConsentContext.Provider value={{ openSettings }}>
      {children}
      {isOpen && (
        <div
          className="ogc-consent-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeSettings();
          }}
        >
          <div
            ref={dialogRef}
            className="ogc-consent-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ogc-consent-title"
            aria-describedby="ogc-consent-description"
            dir={locale === "ar" ? "rtl" : "ltr"}
          >
            <header className="ogc-consent-header">
              <h2 id="ogc-consent-title">{content.title}</h2>
              <button
                ref={closeButtonRef}
                type="button"
                className="ogc-consent-close"
                aria-label={locale === "ar" ? "إغلاق" : "Close"}
                onClick={closeSettings}
              >
                <span aria-hidden>×</span>
              </button>
            </header>
            <div className="ogc-consent-body">
              <div id="ogc-consent-description" className="ogc-consent-intro">
                {content.intro.map((paragraph, index) => (
                  <p key={`${index}-${paragraph}`}>{paragraph}</p>
                ))}
              </div>
              <div className="ogc-consent-categories">
                <ConsentCategory
                  title={content.necessary.title}
                  description={content.necessary.description}
                  status={content.necessary.status}
                  isChecked
                  isDisabled
                />
                {OPTIONAL_CATEGORIES.map((category) => (
                  <ConsentCategory
                    key={category}
                    title={content[category].title}
                    description={content[category].description}
                    isChecked={draft[category]}
                    onChange={(isChecked) =>
                      setDraft((current) => ({ ...current, [category]: isChecked }))
                    }
                  />
                ))}
              </div>
            </div>
            <footer className="ogc-consent-actions">
              <button type="button" className="ogc-button ogc-button-ghost" onClick={() => saveAll(false)}>
                {content.actions.rejectAll}
              </button>
              <button
                type="button"
                className="ogc-button ogc-button-secondary"
                onClick={() => savePreferences(createPreferences(draft))}
              >
                {content.actions.save}
              </button>
              <button type="button" className="ogc-button" onClick={() => saveAll(true)}>
                {content.actions.acceptAll}
              </button>
            </footer>
          </div>
        </div>
      )}
    </CookieConsentContext.Provider>
  );
}

export function CookieSettingsTrigger({ label }: CookieSettingsTriggerProps) {
  const context = useContext(CookieConsentContext);
  return (
    <button
      type="button"
      className="ogc-generic-link ogc-generic-link-text ogc-cookie-settings-trigger"
      aria-haspopup="dialog"
      onClick={(event) => context?.openSettings(event.currentTarget)}
    >
      {label}
    </button>
  );
}

function ConsentCategory({
  title,
  description,
  status,
  isChecked,
  isDisabled = false,
  onChange,
}: {
  title: string;
  description: string;
  status?: string;
  isChecked: boolean;
  isDisabled?: boolean;
  onChange?: (isChecked: boolean) => void;
}) {
  return (
    <section className="ogc-consent-category">
      <div className="ogc-consent-category-heading">
        <div>
          <h3>{title}</h3>
          {status && <p>{status}</p>}
        </div>
        <label className="ogc-consent-switch">
          <input
            type="checkbox"
            checked={isChecked}
            disabled={isDisabled}
            aria-label={title}
            onChange={(event) => onChange?.(event.target.checked)}
          />
          <span aria-hidden />
        </label>
      </div>
      <p>{description}</p>
    </section>
  );
}

function createConsentContent(section: PublicCmsSection, locale: AppLocale) {
  const items = new Map(
    section.content.blocks
      .flatMap((block) => block.items)
      .filter((item): item is Extract<CmsSectionItem, { type: "text" }> => item.type === "text")
      .map((item) => [item.key, locale === "ar" ? item.text.textAr : item.text.textEn])
  );
  const value = (key: string) => items.get(key) ?? "";
  const actions = value("actions")
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  return {
    title: value("title") || (locale === "ar" ? section.titleAr : section.titleEn) || "",
    intro: ["intro-1", "intro-2", "intro-3", "intro-4"].map(value).filter(Boolean),
    necessary: {
      title: value("necessary-title"),
      status: value("necessary-status"),
      description: value("necessary-description"),
    },
    functional: categoryContent(items, "functional"),
    analytics: categoryContent(items, "analytics"),
    performance: categoryContent(items, "performance"),
    advertisement: categoryContent(items, "advertisement"),
    actions: {
      rejectAll: actions[0] ?? (locale === "ar" ? "رفض الكل" : "Reject All"),
      save: actions[1] ?? (locale === "ar" ? "حفظ تفضيلاتي" : "Save My Preferences"),
      acceptAll: actions[2] ?? (locale === "ar" ? "قبول الكل" : "Accept All"),
    },
  };
}

function categoryContent(
  items: Map<string, string>,
  category: (typeof OPTIONAL_CATEGORIES)[number]
) {
  return {
    title: items.get(`${category}-title`) ?? "",
    description: items.get(`${category}-description`) ?? "",
  };
}

function createDefaultPreferences(): CookieConsentPreferences {
  return createPreferences({
    functional: false,
    analytics: false,
    performance: false,
    advertisement: false,
  });
}

function createPreferences(
  value: Pick<
    CookieConsentPreferences,
    "functional" | "analytics" | "performance" | "advertisement"
  >
): CookieConsentPreferences {
  return {
    version: COOKIE_CONSENT_VERSION,
    necessary: true,
    functional: value.functional,
    analytics: value.analytics,
    performance: value.performance,
    advertisement: value.advertisement,
    updatedAt: new Date().toISOString(),
  };
}

export function readCookieConsent(): CookieConsentPreferences | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${COOKIE_CONSENT_COOKIE_NAME}=`))
    ?.slice(COOKIE_CONSENT_COOKIE_NAME.length + 1);
  if (!raw) return null;
  try {
    const value = JSON.parse(decodeURIComponent(raw)) as Partial<CookieConsentPreferences>;
    if (
      value.version !== COOKIE_CONSENT_VERSION ||
      value.necessary !== true ||
      OPTIONAL_CATEGORIES.some((category) => typeof value[category] !== "boolean") ||
      typeof value.updatedAt !== "string"
    ) {
      return null;
    }
    return value as CookieConsentPreferences;
  } catch {
    return null;
  }
}

function writeCookieConsent(value: CookieConsentPreferences) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(value))}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}
