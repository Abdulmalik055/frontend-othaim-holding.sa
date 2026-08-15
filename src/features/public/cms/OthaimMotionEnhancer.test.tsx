// @vitest-environment happy-dom

import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OthaimMotionEnhancer } from "@/features/public/cms/OthaimMotionEnhancer";

describe("OthaimMotionEnhancer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps SSR content visible by default and progressively reveals below-fold content", async () => {
    let callback: IntersectionObserverCallback | undefined;
    const observe = vi.fn();
    const unobserve = vi.fn();
    const disconnect = vi.fn();
    class ObserverMock {
      constructor(nextCallback: IntersectionObserverCallback) {
        callback = nextCallback;
      }
      observe = observe;
      unobserve = unobserve;
      disconnect = disconnect;
    }
    vi.stubGlobal("IntersectionObserver", ObserverMock);
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      top: 1200,
    } as DOMRect);

    const { container } = render(
      <>
        <section className="ogc-reveal">Visible without JavaScript</section>
        <OthaimMotionEnhancer />
      </>
    );
    const section = container.querySelector<HTMLElement>(".ogc-reveal")!;
    await waitFor(() => expect(section.dataset.ogcReveal).toBe("pending"));

    callback?.(
      [{ isIntersecting: true, target: section } as unknown as IntersectionObserverEntry],
      {} as IntersectionObserver
    );

    expect(section.dataset.ogcReveal).toBeUndefined();
    expect(unobserve).toHaveBeenCalledWith(section);
  });
});
