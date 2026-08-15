import { cache } from "react";
import type {
  PublicCmsPage,
  PublicCmsPageSummary,
  PublicCmsSection,
  PublicPlatformSettings,
} from "@/features/public/cms/types";
import { normalizeCmsSectionContent } from "@/features/admin/cms/schemas/cms-section.schema";

export type PublicCmsPageResponse = Omit<PublicCmsPage, "sections"> & {
  sections: Array<
    Omit<PublicCmsSection, "content"> & {
      type?: string;
      content: unknown;
    }
  >;
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

export class PublicCmsRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

async function getJson<T>(path: string): Promise<T> {
  if (!backendUrl) throw new PublicCmsRequestError(500, "Backend URL is not configured");
  let response: Response;
  try {
    response = await fetch(new URL(path, backendUrl), { cache: "no-store" });
  } catch {
    throw new PublicCmsRequestError(503, "The content service is unavailable");
  }
  if (!response.ok) {
    throw new PublicCmsRequestError(response.status, `CMS request failed with ${response.status}`);
  }
  return (await response.json()) as T;
}

export function normalizePublicCmsPage(page: PublicCmsPageResponse): PublicCmsPage {
  return {
    ...page,
    sections: page.sections.map((sectionResponse) => {
      const section = { ...sectionResponse };
      delete section.type;
      return {
        ...section,
        content: normalizeCmsSectionContent(section.content),
      };
    }),
  };
}

export const getPublicCmsPage = cache(async (category: string, slug: string) =>
  normalizePublicCmsPage(
    await getJson<PublicCmsPageResponse>(
      `/api/cms/pages/${encodeURIComponent(category)}/${encodeURIComponent(slug)}`
    )
  )
);

export const getPublicCmsNavigation = cache(() =>
  getJson<PublicCmsPageSummary[]>("/api/cms/pages")
);

export const getPublicPlatformSettings = cache(() =>
  getJson<PublicPlatformSettings>("/api/contact-info")
);
