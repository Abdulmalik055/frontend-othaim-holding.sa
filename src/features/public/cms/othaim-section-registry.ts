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
  "home-team": { kind: "profile-promo", tone: "dark" },
  "home-inspiration": { kind: "quote", tone: "dark" },
  "home-philosophies": { kind: "numbered-cards", tone: "light" },
  "home-partners": { kind: "logos", tone: "dark" },
  "home-contact": { kind: "home-contact", tone: "dark" },
  "about-hero": { kind: "page-hero", tone: "dark" },
  "about-mission": { kind: "quote", tone: "teal" },
  "about-dna": { kind: "numbered-names", tone: "dark" },
  "about-vision": { kind: "numbered-cards", tone: "dark" },
  "about-values": { kind: "numbered-cards", tone: "dark" },
  "about-csr": { kind: "prose", tone: "dark" },
  "family-hero": { kind: "page-hero", tone: "dark" },
  "family-timeline": { kind: "timeline", tone: "dark" },
  "founder-hero": { kind: "founder-hero", tone: "dark" },
  "founder-profile": { kind: "profile-body", tone: "dark" },
  "founder-companies": { kind: "numbered-cards", tone: "dark" },
  "committee-hero": { kind: "page-hero", tone: "dark" },
  "committee-members": { kind: "member-profiles", tone: "dark" },
  "team-hero": { kind: "page-hero", tone: "dark" },
  "team-profile": { kind: "team-profile", tone: "dark" },
  "portfolio-hero": { kind: "page-hero", tone: "dark" },
  "portfolio-philosophy": { kind: "prose", tone: "dark" },
  "portfolio-infrastructure": { kind: "logos", tone: "dark" },
  "portfolio-partners": { kind: "logos", tone: "dark" },
  "strategy-hero": { kind: "page-hero", tone: "dark" },
  "strategy-pillars": { kind: "numbered-cards", tone: "dark" },
  "strategy-closing": { kind: "cta", tone: "teal" },
  "contact-hero": { kind: "page-hero", tone: "dark" },
  "contact-details": { kind: "contact", tone: "dark" },
} satisfies Record<OthaimSectionSlug, OthaimSectionDefinition>;

export const OTHAIM_PAGE_SECTION_SLUGS = {
  home: [
    "home-hero",
    "home-story",
    "home-founder",
    "home-committee",
    "home-team",
    "home-inspiration",
    "home-philosophies",
    "home-partners",
    "home-contact",
  ],
  about: ["about-hero", "about-mission", "about-dna", "about-vision", "about-values", "about-csr"],
  family: ["family-hero", "family-timeline"],
  founder: ["founder-hero", "founder-profile", "founder-companies"],
  committee: ["committee-hero", "committee-members"],
  team: ["team-hero", "team-profile"],
  portfolio: [
    "portfolio-hero",
    "portfolio-philosophy",
    "portfolio-infrastructure",
    "portfolio-partners",
  ],
  strategy: ["strategy-hero", "strategy-pillars", "strategy-closing"],
  contact: ["contact-hero", "contact-details"],
} as const satisfies Record<string, readonly OthaimSectionSlug[]>;

export type OthaimPageSlug = keyof typeof OTHAIM_PAGE_SECTION_SLUGS;

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

export function isOthaimSectionForPage(pageSlug: string, sectionSlug: string) {
  const sectionSlugs = OTHAIM_PAGE_SECTION_SLUGS[pageSlug as OthaimPageSlug];
  return Boolean(sectionSlugs?.some((slug) => slug === sectionSlug));
}
