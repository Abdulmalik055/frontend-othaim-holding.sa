"use client";

import { useEffect } from "react";

export function OthaimMotionEnhancer() {
  useEffect(() => {
    if (
      !window.IntersectionObserver ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const elements = Array.from(document.querySelectorAll<HTMLElement>(".ogc-reveal"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const element = entry.target as HTMLElement;
          delete element.dataset.ogcReveal;
          observer.unobserve(element);
        }
      },
      { threshold: 0.12 }
    );

    for (const element of elements) {
      if (element.getBoundingClientRect().top > window.innerHeight * 0.82) {
        element.dataset.ogcReveal = "pending";
        observer.observe(element);
      }
    }

    return () => {
      observer.disconnect();
      for (const element of elements) delete element.dataset.ogcReveal;
    };
  }, []);

  return null;
}
