"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function PublicNavigationProgress({ label }: { label: string }) {
  const pathname = usePathname();
  const [pendingDestination, setPendingDestination] = useState<string | null>(null);
  const pending = Boolean(pendingDestination && pendingDestination !== pathname);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (
        !(target instanceof HTMLAnchorElement) ||
        target.target ||
        target.hasAttribute("download")
      ) {
        return;
      }

      const destination = new URL(target.href, window.location.href);
      if (
        destination.origin !== window.location.origin ||
        (destination.pathname === window.location.pathname &&
          destination.search === window.location.search)
      ) {
        return;
      }
      setPendingDestination(destination.pathname);
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return (
    <div className={`ogc-navigation-progress${pending ? " is-active" : ""}`} aria-live="polite">
      <span aria-hidden />
      {pending && <span className="sr-only">{label}</span>}
    </div>
  );
}
