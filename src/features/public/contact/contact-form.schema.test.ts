import { describe, expect, it } from "vitest";
import {
  createContactFormSchema,
  toContactInquiryPayload,
} from "@/features/public/contact/contact-form.schema";

describe("contact inquiry contract", () => {
  it("requires a supported topic for the home inquiry", () => {
    const result = createContactFormSchema("home").safeParse({
      fullName: "Sara Othaim",
      organization: "Othaim Global",
      email: "sara@example.com",
      topic: "",
      message: "A sufficiently detailed inquiry.",
      website: "",
    });

    expect(result.success).toBe(false);
  });

  it("creates the exact trimmed home payload with an empty honeypot", () => {
    const payload = toContactInquiryPayload(
      "home",
      "en",
      createContactFormSchema("home").parse({
        fullName: "  Sara Othaim  ",
        organization: "  Othaim Global  ",
        email: "  sara@example.com  ",
        topic: "partnership",
        message: "  We would like to discuss a long-term partnership.  ",
        website: "",
      })
    );

    expect(payload).toEqual({
      source: "home",
      locale: "en",
      fullName: "Sara Othaim",
      organization: "Othaim Global",
      email: "sara@example.com",
      topic: "partnership",
      message: "We would like to discuss a long-term partnership.",
      website: "",
    });
    expect(payload).not.toHaveProperty("subject");
    expect(payload).not.toHaveProperty("attachments");
  });

  it("omits home-only fields from contact-page inquiries", () => {
    const payload = toContactInquiryPayload(
      "contact",
      "ar",
      createContactFormSchema("contact").parse({
        fullName: "أحمد العثيم",
        organization: "",
        email: "ahmed@example.com",
        topic: "",
        message: "هذه رسالة استفسار تحتوي على تفاصيل كافية.",
        website: "",
      })
    );

    expect(payload).toEqual({
      source: "contact",
      locale: "ar",
      fullName: "أحمد العثيم",
      email: "ahmed@example.com",
      message: "هذه رسالة استفسار تحتوي على تفاصيل كافية.",
      website: "",
    });
  });
});
