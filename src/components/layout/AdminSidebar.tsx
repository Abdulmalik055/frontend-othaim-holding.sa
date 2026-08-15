"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { PlatformIdentity } from "@/features/platform/components/PlatformIdentity";
import { ADMIN_NAV_ITEMS, type AdminNavPath, hasAdminPermission } from "./admin-navigation";

type Props = {
  activePath: string;
  locale: string;
  collapsed?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
  permissions?: string[];
  supportNewCount?: number;
};

const HomeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <g transform="translate(2.5 2)">
      <path d="M6.657,18.771V15.7a1.426,1.426,0,0,1,1.424-1.419h2.886A1.426,1.426,0,0,1,12.4,15.7h0v3.076A1.225,1.225,0,0,0,13.6,20h1.924A3.456,3.456,0,0,0,19,16.562h0V7.838a2.439,2.439,0,0,0-.962-1.9L11.458.685a3.18,3.18,0,0,0-3.944,0L.962,5.943A2.42,2.42,0,0,0,0,7.847v8.714A3.456,3.456,0,0,0,3.473,20H5.4a1.235,1.235,0,0,0,1.241-1.229h0" />
    </g>
  </svg>
);

const FileIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="22"
    height="22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const GearIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="22"
    height="22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const SupportIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="22"
    height="22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="22"
    height="22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    <path d="M2 13h20" />
    <path d="M12 13v2" />
  </svg>
);

const CloseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const UsersIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="22"
    height="22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const NAV_ICONS: Record<AdminNavPath, ReactNode> = {
  dashboard: <HomeIcon />,
  cms: <FileIcon />,
  hr: <BriefcaseIcon />,
  support: <SupportIcon />,
  users: <UsersIcon />,
  settings: <GearIcon />,
};

export function AdminSidebar({
  activePath,
  locale,
  collapsed = false,
  onToggle,
  onClose,
  permissions = [],
  supportNewCount = 0,
}: Props) {
  const translations = useTranslations("admin");

  return (
    <aside
      className={`bg-white border-e border-separator min-h-screen flex flex-col transition-all duration-200 ${
        collapsed ? "w-[64px]" : "w-[300px]"
      }`}
    >
      <div
        className={`pt-8 pb-3 flex items-center justify-center gap-3 ${collapsed ? "px-2" : "px-8"}`}
      >
        <PlatformIdentity
          locale={locale}
          className="flex min-w-0 flex-1 items-center gap-3"
          logoContainerClassName="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-gray-200 bg-white"
          logoClassName="h-full w-full object-contain p-1"
          nameClassName={`truncate text-[20px] font-black tracking-tight text-admin-primary ${
            locale === "ar" ? "leading-[1.4]" : "leading-none"
          }`}
          subtitle={translations("panelTitle")}
          subtitleClassName="mt-0.5 text-[10px] text-gray-400"
          showName={!collapsed}
        />
        {!collapsed && onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1 text-gray-400 hover:text-gray-700 transition-colors shrink-0"
            aria-label={translations("closeMenu")}
          >
            <CloseIcon />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto">
        <ul className={`flex flex-col ${collapsed ? "px-2 py-3" : "px-8 pt-2"}`}>
          {ADMIN_NAV_ITEMS.map((item) => {
            if (!hasAdminPermission(permissions, item.permission)) return null;

            const isActive = activePath === item.path || activePath.startsWith(`${item.path}/`);
            const label = translations(item.labelKey as Parameters<typeof translations>[0]);
            const itemClass = `flex items-center gap-3 text-[18px] rounded-[8px] transition-all duration-300 ${
              collapsed ? "justify-center px-2 py-2.5" : "px-4 py-[0.55rem]"
            } ${
              isActive
                ? "bg-admin-primary text-white font-semibold"
                : "text-mid hover:text-admin-primary hover:-translate-x-[5px]"
            }`;

            return (
              <li key={item.path}>
                <Link
                  href={`/${locale}/admin/${item.path}`}
                  onClick={onClose}
                  className={itemClass}
                  title={collapsed ? label : undefined}
                >
                  <span className="flex-shrink-0">{NAV_ICONS[item.path]}</span>
                  {!collapsed && (
                    <>
                      <span className="flex-1">{label}</span>
                      {item.path === "support" && supportNewCount > 0 && (
                        <span className="inline-block h-[18px] min-w-[18px] shrink-0 rounded-full bg-danger-red px-[5px] text-center font-sans text-[10px] font-bold leading-[18px] text-white tabular-nums">
                          {supportNewCount > 99 ? "99+" : supportNewCount}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {onToggle && (
        <button
          onClick={onToggle}
          className="hidden md:flex items-center justify-center h-10 border-t border-separator text-gray-400 hover:text-admin-primary hover:bg-admin-bg transition-colors"
          aria-label={translations(collapsed ? "expandMenu" : "collapseMenu")}
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {collapsed ? <path d="M9 18l6-6-6-6" /> : <path d="M15 18l-6-6 6-6" />}
          </svg>
        </button>
      )}
    </aside>
  );
}
