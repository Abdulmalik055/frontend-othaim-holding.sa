"use client";

import { useEffect, useRef } from "react";

export function useUnsavedChanges(isDirty: boolean, message: string) {
  const isDirtyRef = useRef(isDirty);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const handleDocumentClick = (event: MouseEvent) => {
      if (!isDirtyRef.current || event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(target instanceof HTMLAnchorElement) || target.target === "_blank") return;

      const destination = new URL(target.href, window.location.href);
      if (destination.href === window.location.href) return;
      if (window.confirm(message)) {
        isDirtyRef.current = false;
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    };
    const handlePopState = () => {
      if (!isDirtyRef.current) return;
      if (window.confirm(message)) {
        isDirtyRef.current = false;
        return;
      }
      window.history.forward();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [isDirty, message]);
}
