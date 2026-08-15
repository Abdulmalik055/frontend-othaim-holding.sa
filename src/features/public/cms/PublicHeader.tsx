"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { AppLocale } from "@/i18n/config";
import { Link, usePathname } from "@/i18n/navigation";
import { LocaleSwitch } from "@/features/public/cms/LocaleSwitch";
import type {
  OthaimNavigation,
  OthaimNavigationItem,
} from "@/features/public/cms/public-navigation";

export type PublicHeaderLabels = {
  home: string;
  mainNavigation: string;
  menu: string;
  closeMenu: string;
  whoWeAre: string;
  management: string;
};

export function PublicHeader({
  locale,
  navigation,
  labels,
  logoUrl = "/branding/logo-dark.svg",
  logoAlt = "Othaim Global",
}: {
  locale: AppLocale;
  navigation: OthaimNavigation;
  labels: PublicHeaderLabels;
  logoUrl?: string;
  logoAlt?: string;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<"who" | "management" | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const whoTriggerRef = useRef<HTMLButtonElement>(null);
  const managementTriggerRef = useRef<HTMLButtonElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function updateScrolled() {
      setScrolled(window.scrollY > 24);
    }
    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolled);
  }, []);

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      if (headerRef.current?.contains(event.target as Node)) return;
      setOpenDropdown(null);
      setMobileOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (openDropdown === "who") whoTriggerRef.current?.focus();
      if (openDropdown === "management") managementTriggerRef.current?.focus();
      setOpenDropdown(null);
      if (mobileOpen) {
        setMobileOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileOpen, openDropdown]);

  useEffect(() => {
    if (!mobileOpen) return;
    mobilePanelRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
  }, [mobileOpen]);

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <header ref={headerRef} className={`ogc-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="ogc-header-inner">
        <Link href="/" locale={locale} className="ogc-header-logo" aria-label={labels.home}>
          <Image src={logoUrl} alt={logoAlt} width={218} height={100} priority />
        </Link>

        <nav className="ogc-desktop-nav" aria-label={labels.mainNavigation}>
          <NavDropdown
            id="who-we-are"
            triggerRef={whoTriggerRef}
            label={labels.whoWeAre}
            items={navigation.whoWeAre}
            locale={locale}
            pathname={pathname}
            open={openDropdown === "who"}
            onToggle={() => setOpenDropdown(openDropdown === "who" ? null : "who")}
            onClose={() => setOpenDropdown(null)}
          />
          <NavDropdown
            id="management"
            triggerRef={managementTriggerRef}
            label={labels.management}
            items={navigation.management}
            locale={locale}
            pathname={pathname}
            open={openDropdown === "management"}
            onToggle={() => setOpenDropdown(openDropdown === "management" ? null : "management")}
            onClose={() => setOpenDropdown(null)}
          />
          {navigation.business.map((item) => (
            <PublicNavLink
              key={item.id}
              item={item}
              locale={locale}
              active={pathname === item.href}
            />
          ))}
          <LocaleSwitch locale={locale} />
        </nav>

        <div className="ogc-mobile-actions">
          <LocaleSwitch locale={locale} />
          <button
            ref={menuButtonRef}
            type="button"
            className="ogc-menu-button"
            aria-expanded={mobileOpen}
            aria-controls="ogc-mobile-navigation"
            aria-label={mobileOpen ? labels.closeMenu : labels.menu}
            onClick={() => setMobileOpen((value) => !value)}
          >
            <span aria-hidden />
          </button>
        </div>
      </div>

      <div
        ref={mobilePanelRef}
        id="ogc-mobile-navigation"
        className={`ogc-mobile-nav${mobileOpen ? " is-open" : ""}`}
        hidden={!mobileOpen}
      >
        <nav aria-label={labels.mainNavigation}>
          <MobileGroup
            label={labels.whoWeAre}
            items={navigation.whoWeAre}
            locale={locale}
            pathname={pathname}
            onNavigate={closeMobile}
          />
          <MobileGroup
            label={labels.management}
            items={navigation.management}
            locale={locale}
            pathname={pathname}
            onNavigate={closeMobile}
          />
          <div className="ogc-mobile-group">
            {navigation.business.map((item) => (
              <PublicNavLink
                key={item.id}
                item={item}
                locale={locale}
                active={pathname === item.href}
                onClick={closeMobile}
              />
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}

function NavDropdown({
  id,
  triggerRef,
  label,
  items,
  locale,
  pathname,
  open,
  onToggle,
  onClose,
}: {
  id: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  label: string;
  items: OthaimNavigationItem[];
  locale: AppLocale;
  pathname: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const groupActive = items.some((item) => item.href === pathname);
  return (
    <div className={`ogc-nav-dropdown${open ? " is-open" : ""}`}>
      <button
        ref={triggerRef}
        type="button"
        className={groupActive ? "is-active" : undefined}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={`${id}-menu`}
        onClick={onToggle}
      >
        {label}
        <span aria-hidden>⌄</span>
      </button>
      <div id={`${id}-menu`} className="ogc-dropdown-menu" hidden={!open}>
        {items.map((item) => (
          <PublicNavLink
            key={item.id}
            item={item}
            locale={locale}
            active={pathname === item.href}
            onClick={onClose}
          />
        ))}
      </div>
    </div>
  );
}

function MobileGroup({
  label,
  items,
  locale,
  pathname,
  onNavigate,
}: {
  label: string;
  items: OthaimNavigationItem[];
  locale: AppLocale;
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <div className="ogc-mobile-group">
      <p>{label}</p>
      {items.map((item) => (
        <PublicNavLink
          key={item.id}
          item={item}
          locale={locale}
          active={pathname === item.href}
          onClick={onNavigate}
        />
      ))}
    </div>
  );
}

function PublicNavLink({
  item,
  locale,
  active,
  onClick,
}: {
  item: OthaimNavigationItem;
  locale: AppLocale;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      locale={locale}
      className={active ? "is-active" : undefined}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
    >
      {item.label}
    </Link>
  );
}
