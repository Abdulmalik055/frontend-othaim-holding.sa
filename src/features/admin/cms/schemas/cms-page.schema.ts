import { z } from "zod";
import { CMS_PAGE_CATEGORIES, CMS_PAGE_TEMPLATES } from "@/features/admin/cms/types";

const RESERVED_PUBLIC_INFO_SLUGS = new Set(["admin", "api", "auth", "legal"]);

export const cmsPageSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    titleAr: z.string().trim().min(1),
    titleEn: z.string().trim().min(1),
    category: z.enum(CMS_PAGE_CATEGORIES),
    template: z.enum(CMS_PAGE_TEMPLATES),
    seoTitleAr: z.string().trim().max(60).optional(),
    seoTitleEn: z.string().trim().max(60).optional(),
    seoDescriptionAr: z.string().trim().max(160).optional(),
    seoDescriptionEn: z.string().trim().max(160).optional(),
    seoImageAssetId: z.string().uuid().nullable().optional(),
    isIndexable: z.boolean(),
    isActive: z.boolean(),
  })
  .superRefine((page, context) => {
    const isHomepage = page.slug === "home" || page.template === "home";

    if (page.category === "info" && RESERVED_PUBLIC_INFO_SLUGS.has(page.slug)) {
      context.addIssue({
        code: "custom",
        path: ["slug"],
        message: "This slug is reserved by the application router",
      });
    }

    if (isHomepage) {
      if (page.slug !== "home") {
        context.addIssue({
          code: "custom",
          path: ["slug"],
          message: "The homepage must use the home slug",
        });
      }
      if (page.template !== "home") {
        context.addIssue({
          code: "custom",
          path: ["template"],
          message: "The home slug requires the homepage template",
        });
      }
      if (page.category !== "info") {
        context.addIssue({
          code: "custom",
          path: ["category"],
          message: "The homepage must use the info category",
        });
      }
      if (!page.isActive) {
        context.addIssue({
          code: "custom",
          path: ["isActive"],
          message: "The homepage must remain active",
        });
      }
    }

    if (page.category === "legal" && page.template !== "default") {
      context.addIssue({
        code: "custom",
        path: ["template"],
        message: "Legal pages must use the default template",
      });
    }
    if (page.template === "about" && page.category !== "info") {
      context.addIssue({
        code: "custom",
        path: ["template"],
        message: "The about template requires the info category",
      });
    }
  })
  .transform((page) => ({
    ...page,
    seoTitleAr: page.seoTitleAr || page.titleAr.slice(0, 60),
    seoTitleEn: page.seoTitleEn || page.titleEn.slice(0, 60),
  }));

export type CmsPageFormData = z.infer<typeof cmsPageSchema>;
