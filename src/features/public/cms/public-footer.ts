export function resolvePublicFooterBio(platformBio: string, footerStatement?: string) {
  return footerStatement?.trim() || platformBio;
}
