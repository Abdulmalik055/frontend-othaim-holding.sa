import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../../../app/globals.css", import.meta.url), "utf8").replace(
  /\s+/g,
  " "
);
const localeLayout = readFileSync(
  new URL("../../../app/[locale]/layout.tsx", import.meta.url),
  "utf8",
);

describe("approved public background treatments", () => {
  it("uses the exact three-glow subpage hero background", () => {
    expect(css).toContain(
      "radial-gradient(circle at 78% 18%, rgb(45 138 150 / 0.28), transparent 42%), radial-gradient(circle at 12% 82%, rgb(59 187 199 / 0.14), transparent 48%), radial-gradient(circle at 50% 50%, rgb(32 99 108 / 0.16), transparent 70%), linear-gradient(160deg, var(--ogc-dark-3) 0%, var(--ogc-dark) 55%, #0f2226 100%)"
    );
  });

  it("uses the approved Home hero eyebrow spacing", () => {
    expect(css).toMatch(
      /\.ogc-hero-eyebrow \{[^}]*margin-block-end: 28px;[^}]*letter-spacing: 4px;/
    );
  });

  it("does not apply an invented gradient to every dark section", () => {
    expect(css).toMatch(/\.ogc-section-dark \{ background: var\(--ogc-dark\); \}/);
  });

  it("uses the approved plain dark-two treatment on founder biography", () => {
    expect(css).toMatch(
      /\.ogc-section-founder-profile[^\{]*\{ background: var\(--ogc-dark-2\); \}/
    );
  });

  it("preserves the approved Committee card typography and spacing", () => {
    expect(css).toMatch(
      /\.ogc-member-profile \{[^}]*grid-template-columns: repeat\(12, minmax\(0, 1fr\)\);/,
    );
    expect(css).toMatch(/\.ogc-member-identity \{ grid-column: span 3;/);
    expect(css).toMatch(/\.ogc-member-copy \{ grid-column: span 9;/);
    expect(css).toMatch(
      /\.ogc-member-identity h2 \{[^}]*margin-block-end: 8px;/
    );
    expect(css).toMatch(
      /\.ogc-member-profile \.ogc-lead \{[^}]*line-height: 24px;/
    );
    expect(css).toMatch(
      /\.ogc-member-profile:nth-child\(3\) \.ogc-member-copy \{ padding-block-end: 16px;/,
    );
    expect(css).toMatch(
      /\.ogc-member-profile \.ogc-education p,[^{]*\.ogc-member-profile \.ogc-education ul \{[^}]*max-width: 620px;/,
    );
  });

  it("uses the approved twelve-pixel Portfolio logo-grid gap", () => {
    expect(css).toMatch(
      /\.ogc-section-portfolio-infrastructure \.ogc-logo-grid,[^{]*\.ogc-section-portfolio-partners \.ogc-logo-grid \{ grid-gap: 12px; gap: 12px;/
    );
    expect(css).toMatch(
      /\.ogc-logo-image \{[^}]*height: auto;[^}]*max-height: 68px;/,
    );
    expect(css).toMatch(/\.ogc-logo-image picture \{[^}]*height: auto;/);
  });

  it("uses the approved twelve-track five-seven prose grid", () => {
    expect(css).toMatch(
      /\.ogc-section-about-csr \.ogc-prose-grid,[^{]*\.ogc-section-portfolio-philosophy \.ogc-prose-grid \{ grid-template-columns: repeat\(12, minmax\(0, 1fr\)\);[^}]*gap: 48px;/,
    );
    expect(css).toMatch(
      /\.ogc-section-about-csr \.ogc-prose-grid > :first-child,[^{]*\.ogc-section-portfolio-philosophy \.ogc-prose-grid > :first-child \{ grid-column: span 5;/,
    );
    expect(css).toMatch(
      /\.ogc-section-about-csr \.ogc-prose-grid > :last-child,[^{]*\.ogc-section-portfolio-philosophy \.ogc-prose-grid > :last-child \{ grid-column: span 7;/,
    );
  });

  it("uses the approved twelve-track Founder hero split", () => {
    expect(css).toMatch(
      /\.ogc-profile-hero \.ogc-split \{ grid-template-columns: repeat\(12, minmax\(0, 1fr\)\); gap: 48px;/,
    );
    expect(css).toMatch(/\.ogc-profile-hero \.ogc-founder-copy \{ grid-column: span 7;/);
    expect(css).toMatch(/\.ogc-profile-hero \.ogc-founder-portrait \{ grid-column: span 5;/);
  });

  it("uses the approved twelve-track Home founder split", () => {
    expect(css).toMatch(
      /\.ogc-home-founder \.ogc-split \{ grid-template-columns: repeat\(12, minmax\(0, 1fr\)\); gap: 48px;/,
    );
    expect(css).toMatch(/\.ogc-home-founder \.ogc-split > :first-child \{ grid-column: span 4;/);
    expect(css).toMatch(/\.ogc-home-founder \.ogc-split > :last-child \{ grid-column: span 8;/);
    expect(css).toMatch(/\.ogc-home-founder \.ogc-button \{ margin-block-start: 36px;/);
  });

  it("preserves the approved Home story paragraph and button rhythm", () => {
    expect(css).toMatch(
      /\.ogc-home-story \.ogc-split > div:last-child > \.ogc-lead:first-child \{ margin-block: 0 24px;/,
    );
    expect(css).toMatch(
      /\.ogc-home-story \.ogc-split > div:last-child > \.ogc-lead \+ \.ogc-lead \{ margin-block: 0 32px;/,
    );
    expect(css).toMatch(
      /\.ogc-home-story \.ogc-split > div:last-child > \.ogc-button \{ margin-block-start: 0;/,
    );
    expect(css).toMatch(
      /@media \(max-width: 767px\) \{[^@]*\.ogc-home-story \.ogc-lead,[^{]*\.ogc-home-founder \.ogc-lead[^}]*\{ font-size: 16px; line-height: 24px;/,
    );
  });

  it("collapses source wrapping inside public lead copy", () => {
    expect(css).toMatch(/(?:^|\}) \.ogc-lead \{[^}]*white-space: normal;/);
  });

  it("matches the approved prose-column padding and paragraph rhythm", () => {
    expect(css).toMatch(
      /\.ogc-section-about-csr \.ogc-prose-grid,[^{]*\.ogc-section-portfolio-philosophy \.ogc-prose-grid \{[^}]*align-items: stretch;/,
    );
    expect(css).toMatch(
      /\.ogc-section-about-csr \.ogc-prose-grid > :last-child,[^{]*\.ogc-section-portfolio-philosophy \.ogc-prose-grid > :last-child \{[^}]*padding-block-start: 24px;/,
    );
    expect(css).toMatch(
      /\.ogc-section-about-csr \.ogc-lead \+ \.ogc-lead,[^{]*\.ogc-section-portfolio-philosophy \.ogc-lead \+ \.ogc-lead \{ margin-block-start: 20px;/,
    );
  });

  it("collapses every high-specificity profile and prose grid on mobile", () => {
    expect(css).toMatch(
      /@media \(max-width: 1023px\) \{[^@]*\.ogc-split,[^{]*\.ogc-prose-grid,[^{]*\.ogc-team-profile,[^{]*\.ogc-timeline-layout \{ grid-template-columns: 1fr;/,
    );
    expect(css).toMatch(
      /@media \(max-width: 860px\) \{[^@]*\.ogc-section-about-csr \.ogc-prose-grid,[^{]*\.ogc-section-portfolio-philosophy \.ogc-prose-grid,[^{]*\.ogc-section-founder-profile \.ogc-prose-grid,[^{]*\.ogc-section-team-profile \.ogc-team-profile \{ grid-template-columns: 1fr;/,
    );
    expect(css).toMatch(
      /@media \(max-width: 1023px\) \{[^@]*\.ogc-profile-hero h1 \{ max-width: none;/,
    );
  });

  it("preserves the approved intermediate logo and card breakpoints", () => {
    expect(css).toMatch(
      /@media \(max-width: 1023px\) \{[^@]*\.ogc-section-about-dna \.ogc-pill-grid,[^{]*\.ogc-section-portfolio-partners \.ogc-logo-grid \{ grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/,
    );
    expect(css).toMatch(
      /@media \(max-width: 1023px\) \{[^@]*\.ogc-section-about-values \.ogc-card-grid \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/,
    );
    expect(css).toMatch(
      /@media \(max-width: 980px\) \{[^@]*\.ogc-section-portfolio-infrastructure \.ogc-logo-grid,[^{]*\.ogc-home-partners \.ogc-logo-grid \{ grid-template-columns: repeat\(4, minmax\(0, 1fr\)\);/,
    );
    expect(css).toMatch(
      /@media \(max-width: 767px\) \{[^@]*\.ogc-logo-grid,[^{]*\.ogc-pill-grid \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/,
    );
    expect(css).toMatch(
      /@media \(max-width: 767px\) \{[^@]*\.ogc-card-grid,[^{]*\.ogc-people-grid \{ grid-template-columns: 1fr;/,
    );
  });

  it("uses the approved mobile body typography and timeline gap", () => {
    expect(css).toMatch(
      /@media \(max-width: 767px\) \{[^@]*\.ogc-home-story \.ogc-lead,[^{]*\.ogc-section-founder-profile \.ogc-lead,[^{]*\.ogc-section-founder-profile \.ogc-position-list/,
    );
    expect(css).toMatch(
      /@media \(max-width: 767px\) \{[^@]*\.ogc-home-story \.ogc-lead,[^{]*\.ogc-section-about-csr \.ogc-lead,[^{]*\.ogc-section-portfolio-philosophy \.ogc-lead/,
    );
    expect(css).toMatch(
      /@media \(max-width: 767px\) \{[^@]*\.ogc-home-story \.ogc-lead,[^{]*\.ogc-team-profile \.ogc-lead,[^{]*\.ogc-team-profile \.ogc-education ul,[^{]*\.ogc-section-strategy-pillars \.ogc-number-card \.ogc-lead,[^{]*\.ogc-section-portfolio-partners \.ogc-section-heading \.ogc-lead \{ font-size: 16px; line-height: 24px;/,
    );
    expect(css).toMatch(/@media \(max-width: 860px\) \{[^@]*\.ogc-timeline-layout \{ gap: 48px;/);
  });

  it("uses natural card-title wrapping and the approved closing-copy size", () => {
    expect(css).toMatch(/(?:^|\}) \.ogc-public h3 \{ white-space: normal;/);
    expect(css).toMatch(
      /\[dir="rtl"\] \.ogc-public h1,[^{]*\[dir="rtl"\] \.ogc-public h2,[^{]*\[dir="rtl"\] \.ogc-public h3 \{[^}]*letter-spacing: -0\.02em;/,
    );
    expect(css).toMatch(/\.ogc-closing-cta \.ogc-lead \{[^}]*font-size: 18px;/);
    expect(css).toMatch(
      /\.ogc-closing-cta \.ogc-container \{[^}]*max-width: 1180px;/,
    );
    expect(css).toMatch(
      /\.ogc-closing-copy \{[^}]*max-width: 768px;[^}]*margin-inline-end: auto;/,
    );
    expect(css).toMatch(
      /\.ogc-closing-cta \.ogc-lead \{[^}]*color: rgb\(255 255 255 \/ 0\.85\);/,
    );
  });

  it("matches the approved quote, Founder-list, and Team-list treatments", () => {
    expect(css).toMatch(
      /\.ogc-about-mission blockquote,[^{]*\.ogc-home-inspiration blockquote \{[^}]*font-family: inherit;[^}]*letter-spacing: -0\.02em;/,
    );
    expect(css).toMatch(/\.ogc-position-list \{[^}]*color: var\(--ogc-muted\);/);
    expect(css).toMatch(
      /\.ogc-team-profile \.ogc-education ul \{[^}]*padding: 0;[^}]*list-style: none;/,
    );
    expect(css).toMatch(
      /\.ogc-team-profile \.ogc-education ul \{[^}]*max-width: 620px;[^}]*color: var\(--ogc-muted\);/,
    );
    expect(css).toMatch(
      /\.ogc-team-profile \.ogc-education li::before \{[^}]*content: "→";[^}]*color: var\(--ogc-accent\);/,
    );
    expect(css).toMatch(
      /\.ogc-team-profile \{[^}]*grid-template-columns: repeat\(12, minmax\(0, 1fr\)\);/,
    );
    expect(css).toMatch(/\.ogc-team-profile > :first-child \{ grid-column: span 4;/);
    expect(css).toMatch(/\.ogc-team-profile > :last-child \{ grid-column: span 8;/);
    expect(css).toMatch(
      /\.ogc-section-founder-profile \.ogc-prose-grid \{ grid-template-columns: repeat\(12, minmax\(0, 1fr\)\);/,
    );
  });

  it("self-hosts the approved site's exact variable Inter webfont", () => {
    expect(localeLayout).toContain('Inter-Variable.woff2"');
    for (const weight of ["300", "400", "500", "600", "700", "800"]) {
      expect(localeLayout).toContain(`weight: "${weight}"`);
    }
    expect(
      existsSync(new URL("../../../assets/fonts/Inter-Variable.woff2", import.meta.url)),
    ).toBe(true);
  });

  it("uses the approved six-percent card border", () => {
    expect(css).toMatch(
      /\.ogc-number-card \{[^}]*border: 1px solid rgb\(255 255 255 \/ 0\.06\);/,
    );
  });

  it("keeps the approved footer layout while meeting text contrast", () => {
    expect(css).toMatch(
      /\.ogc-footer-bottom \{[^}]*color: rgb\(255 255 255 \/ 0\.5\);[^}]*font-size: 12px;/,
    );
  });

  it("preserves the approved team-role tracking", () => {
    expect(css).toMatch(
      /\.ogc-team-profile \.ogc-person-role \{[^}]*letter-spacing: 3px;/,
    );
    expect(css).toMatch(
      /\.ogc-home-team \.ogc-person-role \{[^}]*letter-spacing: 3px;/,
    );
  });

  it("keeps the approved full-background Home sections and mobile copy sizes", () => {
    expect(css).toMatch(
      /@media \(max-width: 860px\) \{[^@]*\.ogc-home-founder,[^{]*\.ogc-home-team \{ padding: 100px 24px;/,
    );
    expect(css).toMatch(
      /@media \(max-width: 767px\) \{[^@]*\.ogc-home-story \.ogc-lead,[^{]*\.ogc-home-founder \.ogc-lead,[^{]*\.ogc-home-team \.ogc-lead,[^{]*\.ogc-home-partners \.ogc-lead[^}]*\{ font-size: 16px; line-height: 24px;/,
    );
    expect(css).toMatch(
      /\[dir="rtl"\] \.ogc-home-inspiration blockquote \{[^}]*font-weight: 400;/,
    );
  });

  it("matches the approved responsive Home contact card", () => {
    expect(css).toMatch(
      /\.ogc-home-contact h2 \{[^}]*font-size: clamp\(32px, 3\.8vw, 52px\);[^}]*letter-spacing: -0\.025em;/,
    );
    expect(css).toMatch(
      /@media \(max-width: 680px\) \{[^@]*\.ogc-home-contact \.ogc-contact-grid \{ padding-inline: 24px;/,
    );
    expect(css).toMatch(
      /@media \(max-width: 480px\) \{[^@]*\.ogc-home-contact \.ogc-form-card \{ padding: 28px 22px;/,
    );
    expect(css).toMatch(
      /@media \(max-width: 767px\) \{[^@]*\.ogc-home-contact \.ogc-section-heading \.ogc-lead \{ font-size: 14px; line-height: 23\.8px;/,
    );
    expect(css).toMatch(
      /@media \(max-width: 767px\) \{[^@]*\[dir="ltr"\] \.ogc-home-contact \.ogc-section-heading \.ogc-lead \{ letter-spacing: -0\.005em;/,
    );
  });

  it("lets mobile Portfolio logos retain their intrinsic height", () => {
    expect(css).toMatch(
      /@media \(max-width: 680px\) \{[^@]*\.ogc-logo-image,[^{]*\.ogc-logo-image picture \{ height: auto;/,
    );
  });
});
