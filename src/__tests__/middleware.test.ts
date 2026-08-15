import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

// Mock next-intl/middleware — returns null to let our middleware handle the response
vi.mock("next-intl/middleware", () => ({
  default: () => () => null,
}));

// Mock routing config
vi.mock("@/i18n/routing", () => ({
  routing: { locales: ["ar", "en"], defaultLocale: "ar" },
}));

import { proxy } from "../proxy";

// ─── Helpers ─────────────────────────────────────────────────

function makeRequest(
  pathname: string,
  cookies: Record<string, string> = {},
  headers: Record<string, string> = {}
) {
  const url = `http://localhost:3000${pathname}`;
  const cookieHeader = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
  return new NextRequest(url, {
    headers: {
      ...headers,
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
  });
}

const DOCUMENT_HEADERS = { accept: "text/html" };

const SESSION_COOKIE = { "othaim-global.session_token": "test-token-123" };

// ─── Tests ───────────────────────────────────────────────────

describe("middleware — protected routes", () => {
  it("redirects unauthenticated user from /ar/admin to login", async () => {
    const req = makeRequest("/ar/admin");
    const res = await proxy(req);

    expect(res?.status).toBe(307);
    const location = res?.headers.get("location") ?? "";
    expect(location).toContain("/ar/auth/login");
    expect(location).not.toContain("callbackUrl");
  });

  it("redirects unauthenticated user from /en/admin/users to login", async () => {
    const req = makeRequest("/en/admin/users");
    const res = await proxy(req);

    expect(res?.status).toBe(307);
    const location = res?.headers.get("location") ?? "";
    expect(location).toContain("/en/auth/login");
    expect(location).not.toContain("callbackUrl");
  });

  it("allows authenticated user to access /ar/admin", async () => {
    const req = makeRequest("/ar/admin", SESSION_COOKIE);
    const res = await proxy(req);

    expect(res?.status).toBe(200);
    expect(res?.headers.get("location")).toBeNull();
  });

  it("uses __Secure- prefixed cookie for protected admin routes", async () => {
    const req = makeRequest("/ar/admin", {
      "__Secure-othaim-global.session_token": "secure-token",
    });
    const res = await proxy(req);

    expect(res?.status).toBe(200);
    expect(res?.headers.get("location")).toBeNull();
  });
});

describe("middleware — auth login route", () => {
  it("redirects authenticated user from /ar/auth/login to admin dashboard", async () => {
    const req = makeRequest("/ar/auth/login", SESSION_COOKIE);
    const res = await proxy(req);

    expect(res?.status).toBe(307);
    const location = res?.headers.get("location") ?? "";
    expect(location).toContain("/ar/admin/dashboard");
  });

  it("redirects authenticated user from /en/auth/login to admin dashboard", async () => {
    const req = makeRequest("/en/auth/login", SESSION_COOKIE);
    const res = await proxy(req);

    expect(res?.status).toBe(307);
    const location = res?.headers.get("location") ?? "";
    expect(location).toContain("/en/admin/dashboard");
  });

  it("allows unauthenticated user to access /ar/auth/login", async () => {
    const req = makeRequest("/ar/auth/login");
    const res = await proxy(req);

    expect(res?.status).toBe(200);
    expect(res?.headers.get("location")).toBeNull();
  });
});

describe("middleware — locale detection", () => {
  it("uses /en locale correctly for protected admin redirect", async () => {
    const req = makeRequest("/en/admin");
    const res = await proxy(req);

    expect(res?.status).toBe(307);
    const location = res?.headers.get("location") ?? "";
    expect(location).toContain("/en/auth/login");
  });

  it("defaults to /ar locale when no locale prefix for protected admin route", async () => {
    const req = makeRequest("/admin");
    const res = await proxy(req);

    expect(res?.status).toBe(307);
    const location = res?.headers.get("location") ?? "";
    expect(location).toContain("/ar/auth/login");
  });

  it("uses the shared locale cookie before Accept-Language", async () => {
    const req = makeRequest(
      "/",
      { "othaim-global.locale": "ar" },
      { ...DOCUMENT_HEADERS, "accept-language": "en-US,en;q=0.9" }
    );
    const res = await proxy(req);

    expect(res?.status).toBe(307);
    expect(res?.headers.get("location")).toBe("http://localhost:3000/ar");
  });

  it("uses Accept-Language when the locale cookie is absent", async () => {
    const req = makeRequest(
      "/",
      {},
      { ...DOCUMENT_HEADERS, "accept-language": "fr;q=0.9,en-US;q=0.8" }
    );
    const res = await proxy(req);

    expect(res?.status).toBe(307);
    expect(res?.headers.get("location")).toBe("http://localhost:3000/en");
  });

  it("falls back to Arabic when no supported request language exists", async () => {
    const req = makeRequest("/", {}, { ...DOCUMENT_HEADERS, "accept-language": "fr-FR" });
    const res = await proxy(req);

    expect(res?.status).toBe(307);
    expect(res?.headers.get("location")).toBe("http://localhost:3000/ar");
  });

  it("resolves an unlocalized legacy info URL in one temporary redirect", async () => {
    const req = makeRequest("/info/about", {}, { ...DOCUMENT_HEADERS, "accept-language": "en-US" });
    const res = await proxy(req);

    expect(res?.status).toBe(307);
    expect(res?.headers.get("location")).toBe("http://localhost:3000/en/about");
  });
});

describe("middleware — legacy public URLs", () => {
  it.each([
    ["/ar/index.html", "/ar"],
    ["/en/about.html", "/en/about"],
    ["/ar/info/family", "/ar/family"],
  ])("permanently redirects %s to %s", async (from, to) => {
    const res = await proxy(makeRequest(from, {}, DOCUMENT_HEADERS));

    expect(res?.status).toBe(308);
    expect(res?.headers.get("location")).toBe(`http://localhost:3000${to}`);
  });
});

describe("middleware — public routes", () => {
  it("allows unauthenticated user to access public route", async () => {
    const req = makeRequest("/ar");
    const res = await proxy(req);

    expect(res?.status).toBe(200);
    expect(res?.headers.get("location")).toBeNull();
  });

  it("allows unauthenticated user to access /auth/login", async () => {
    const req = makeRequest("/en/auth/login");
    const res = await proxy(req);

    expect(res?.status).toBe(200);
    expect(res?.headers.get("location")).toBeNull();
  });
});
