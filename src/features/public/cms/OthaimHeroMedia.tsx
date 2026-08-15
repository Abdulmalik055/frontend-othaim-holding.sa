"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";

type NetworkInformation = {
  saveData?: boolean;
  addEventListener?: (type: "change", listener: () => void) => void;
  removeEventListener?: (type: "change", listener: () => void) => void;
};

function getConnection() {
  return (navigator as Navigator & { connection?: NetworkInformation }).connection;
}

function subscribeToVideoPreference(onChange: () => void) {
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const dataPreference = window.matchMedia("(prefers-reduced-data: reduce)");
  const connection = getConnection();
  motionPreference.addEventListener("change", onChange);
  dataPreference.addEventListener("change", onChange);
  connection?.addEventListener?.("change", onChange);
  return () => {
    motionPreference.removeEventListener("change", onChange);
    dataPreference.removeEventListener("change", onChange);
    connection?.removeEventListener?.("change", onChange);
  };
}

function getVideoPreference() {
  return (
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    !window.matchMedia("(prefers-reduced-data: reduce)").matches &&
    !getConnection()?.saveData
  );
}

export function OthaimHeroMedia({
  videoUrl,
  videoType,
  mobileVideoUrl,
  mobileVideoType,
  posterUrl,
  mobilePosterUrl,
}: {
  videoUrl?: string | null;
  videoType?: string | null;
  mobileVideoUrl?: string | null;
  mobileVideoType?: string | null;
  posterUrl?: string | null;
  mobilePosterUrl?: string | null;
}) {
  const videoPreferenceAllowsPlayback = useSyncExternalStore(
    subscribeToVideoPreference,
    getVideoPreference,
    () => false
  );
  const videoAllowed = Boolean(videoUrl) && videoPreferenceAllowsPlayback;
  const hasDistinctMobilePoster = Boolean(mobilePosterUrl && mobilePosterUrl !== posterUrl);

  return (
    <div className="ogc-hero-media" aria-hidden>
      {!videoAllowed && posterUrl && (
        <Image
          src={posterUrl}
          alt=""
          fill
          priority
          sizes="100vw"
          className={`ogc-hero-poster${hasDistinctMobilePoster ? " ogc-hero-poster-desktop" : ""}`}
        />
      )}
      {!videoAllowed && hasDistinctMobilePoster && mobilePosterUrl && (
        <Image
          src={mobilePosterUrl}
          alt=""
          fill
          priority
          sizes="100vw"
          className="ogc-hero-poster ogc-hero-poster-mobile"
        />
      )}
      {videoAllowed && videoUrl && (
        <video autoPlay muted loop playsInline preload="metadata" poster={posterUrl ?? undefined}>
          {mobileVideoUrl && (
            <source
              src={mobileVideoUrl}
              type={mobileVideoType ?? undefined}
              media="(max-width: 680px)"
            />
          )}
          <source src={videoUrl} type={videoType ?? undefined} />
        </video>
      )}
    </div>
  );
}
