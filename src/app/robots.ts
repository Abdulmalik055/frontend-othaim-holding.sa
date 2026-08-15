import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/auth", "/ar/admin", "/en/admin", "/ar/auth", "/en/auth"],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
    host: new URL(siteUrl).origin,
  };
}
