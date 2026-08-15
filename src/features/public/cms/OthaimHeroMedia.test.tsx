// @vitest-environment happy-dom

import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OthaimHeroMedia } from "@/features/public/cms/OthaimHeroMedia";

vi.mock("next/image", () => ({
  default: ({ src, className }: { src: string; className?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element -- test double exposes responsive DOM state.
    <img src={src} alt="" className={className} />
  ),
}));

const mediaPreferences = {
  reducedMotion: false,
  reducedData: false,
};

describe("OthaimHeroMedia", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn((query: string) => ({
        matches: query.includes("reduced-motion")
          ? mediaPreferences.reducedMotion
          : mediaPreferences.reducedData,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: { saveData: false, addEventListener: vi.fn(), removeEventListener: vi.fn() },
    });
  });

  afterEach(() => {
    mediaPreferences.reducedMotion = false;
    mediaPreferences.reducedData = false;
    vi.restoreAllMocks();
  });

  it("shows the responsive video without painting poster images above it", () => {
    const { container } = render(
      <OthaimHeroMedia
        videoUrl="/uploads/hero-desktop.mp4"
        videoType="video/mp4"
        mobileVideoUrl="/uploads/hero-mobile.mp4"
        mobileVideoType="video/mp4"
        posterUrl="/uploads/poster-desktop.jpg"
        mobilePosterUrl="/uploads/poster-mobile.jpg"
      />
    );

    expect(container.querySelector("video")).toBeTruthy();
    expect(container.querySelectorAll("video source")).toHaveLength(2);
    expect(container.querySelector('source[media="(max-width: 680px)"]')?.getAttribute("src")).toBe(
      "/uploads/hero-mobile.mp4"
    );
    expect(container.querySelector("img")).toBeNull();
  });

  it("uses desktop and mobile posters when reduced motion disables autoplay", () => {
    mediaPreferences.reducedMotion = true;

    const { container } = render(
      <OthaimHeroMedia
        videoUrl="/uploads/hero-desktop.mp4"
        posterUrl="/uploads/poster-desktop.jpg"
        mobilePosterUrl="/uploads/poster-mobile.jpg"
      />
    );

    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelectorAll("img")).toHaveLength(2);
    expect(container.querySelector(".ogc-hero-poster-mobile")?.getAttribute("src")).toBe(
      "/uploads/poster-mobile.jpg"
    );
  });
});
