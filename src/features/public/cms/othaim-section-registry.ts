export const OTHAIM_SECTION_SLUGS = [
  "home-hero",
  "home-story",
  "home-founder",
  "home-committee",
  "home-team",
  "home-inspiration",
  "home-philosophies",
  "home-partners",
  "home-contact",
  "about-hero",
  "about-mission",
  "about-dna",
  "about-vision",
  "about-values",
  "about-csr",
  "family-hero",
  "family-timeline",
  "founder-hero",
  "founder-profile",
  "founder-companies",
  "committee-hero",
  "committee-members",
  "team-hero",
  "team-profile",
  "portfolio-hero",
  "portfolio-philosophy",
  "portfolio-infrastructure",
  "portfolio-partners",
  "strategy-hero",
  "strategy-pillars",
  "strategy-closing",
  "contact-hero",
  "contact-details",
] as const;

export type OthaimSectionSlug = (typeof OTHAIM_SECTION_SLUGS)[number];

export type OthaimSectionKind =
  | "video-hero"
  | "page-hero"
  | "founder-hero"
  | "story"
  | "profile-promo"
  | "people-preview"
  | "quote"
  | "numbered-names"
  | "numbered-cards"
  | "logos"
  | "prose"
  | "timeline"
  | "profile-body"
  | "member-profiles"
  | "team-profile"
  | "cta"
  | "home-contact"
  | "contact"
  | "fallback";

export type OthaimSectionDefinition = {
  kind: OthaimSectionKind;
  tone?: "dark" | "teal" | "light";
};

const sectionRegistry = {
  "home-hero": { kind: "video-hero", tone: "dark" },
  "home-story": { kind: "story", tone: "light" },
  "home-founder": { kind: "profile-promo", tone: "dark" },
  "home-committee": { kind: "people-preview", tone: "teal" },
  "home-team": { kind: "profile-promo", tone: "light" },
  "home-inspiration": { kind: "quote", tone: "dark" },
  "home-philosophies": { kind: "numbered-cards", tone: "light" },
  "home-partners": { kind: "logos", tone: "light" },
  "home-contact": { kind: "home-contact", tone: "dark" },
  "about-hero": { kind: "page-hero", tone: "dark" },
  "about-mission": { kind: "quote", tone: "teal" },
  "about-dna": { kind: "numbered-names", tone: "dark" },
  "about-vision": { kind: "numbered-cards", tone: "light" },
  "about-values": { kind: "numbered-cards", tone: "dark" },
  "about-csr": { kind: "prose", tone: "light" },
  "family-hero": { kind: "page-hero", tone: "dark" },
  "family-timeline": { kind: "timeline", tone: "light" },
  "founder-hero": { kind: "founder-hero", tone: "dark" },
  "founder-profile": { kind: "profile-body", tone: "light" },
  "founder-companies": { kind: "numbered-cards", tone: "dark" },
  "committee-hero": { kind: "page-hero", tone: "dark" },
  "committee-members": { kind: "member-profiles", tone: "light" },
  "team-hero": { kind: "page-hero", tone: "dark" },
  "team-profile": { kind: "team-profile", tone: "light" },
  "portfolio-hero": { kind: "page-hero", tone: "dark" },
  "portfolio-philosophy": { kind: "prose", tone: "light" },
  "portfolio-infrastructure": { kind: "logos", tone: "dark" },
  "portfolio-partners": { kind: "logos", tone: "light" },
  "strategy-hero": { kind: "page-hero", tone: "dark" },
  "strategy-pillars": { kind: "numbered-cards", tone: "light" },
  "strategy-closing": { kind: "cta", tone: "teal" },
  "contact-hero": { kind: "page-hero", tone: "dark" },
  "contact-details": { kind: "contact", tone: "light" },
} satisfies Record<OthaimSectionSlug, OthaimSectionDefinition>;

const fallbackDefinition: OthaimSectionDefinition = {
  kind: "fallback",
  tone: "light",
};

export function getOthaimSectionDefinition(slug: string): OthaimSectionDefinition {
  return sectionRegistry[slug as OthaimSectionSlug] ?? fallbackDefinition;
}

export function isOthaimSectionSlug(slug: string): slug is OthaimSectionSlug {
  return Object.hasOwn(sectionRegistry, slug);
}
