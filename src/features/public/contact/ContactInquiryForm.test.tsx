// @vitest-environment happy-dom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContactInquiryForm } from "@/features/public/contact/ContactInquiryForm";

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_BACKEND_URL = "http://backend.example";
});

const labels = {
  fullName: "Full name",
  organization: "Organization",
  email: "Email",
  topic: "Topic",
  message: "Message",
  submit: "Send inquiry",
  submitting: "Sending…",
  success: "Thank you. Your inquiry was received.",
  error: "We could not send your inquiry.",
  rateLimited: "Please wait before trying again.",
  confidentiality: "Your message is handled confidentially.",
  topics: {
    partnership: "Partnership",
    co_investment: "Co-investment",
    family_office: "Family office",
    media: "Media",
    other: "Other",
  },
  validation: {
    fullName: "Enter your full name.",
    organization: "Organization is too long.",
    email: "Enter a valid email.",
    topic: "Select a topic.",
    message: "Enter a detailed message.",
  },
};

describe("ContactInquiryForm", () => {
  afterEach(() => vi.restoreAllMocks());

  it("submits the exact contact-page backend contract", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ accepted: true }), {
        status: 201,
        headers: { "content-type": "application/json" },
      })
    );
    render(<ContactInquiryForm source="contact" locale="en" labels={labels} />);

    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Sara Othaim" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "sara@example.com" } });
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "I would like to discuss an opportunity with your team." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send inquiry" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/contact-inquiries");
    expect(JSON.parse(String(init?.body))).toEqual({
      source: "contact",
      locale: "en",
      fullName: "Sara Othaim",
      email: "sara@example.com",
      message: "I would like to discuss an opportunity with your team.",
      website: "",
    });
    expect((await screen.findByRole("status")).textContent).toContain(
      "Thank you. Your inquiry was received."
    );
  });

  it("exposes required home fields and reports throttling accessibly", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 429 }));
    render(<ContactInquiryForm source="home" locale="en" labels={labels} />);

    expect(screen.getByLabelText("Organization")).toBeTruthy();
    expect((screen.getByLabelText("Topic") as HTMLSelectElement).required).toBe(true);

    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Sara Othaim" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "sara@example.com" } });
    fireEvent.change(screen.getByLabelText("Topic"), { target: { value: "media" } });
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "I would like to arrange a media interview with your team." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send inquiry" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Please wait before trying again."
    );
  });

  it("focuses and announces the first invalid field", async () => {
    render(<ContactInquiryForm source="contact" locale="en" labels={labels} />);

    fireEvent.click(screen.getByRole("button", { name: "Send inquiry" }));

    const fullName = screen.getByLabelText("Full name");
    await waitFor(() => expect(document.activeElement).toBe(fullName));
    expect(screen.getByText("Enter your full name.").textContent).toBe("Enter your full name.");
    expect(fullName.getAttribute("aria-invalid")).toBe("true");
  });
});
