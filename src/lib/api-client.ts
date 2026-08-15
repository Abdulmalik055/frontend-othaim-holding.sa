type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions<TBody = unknown> {
  method?: HttpMethod;
  body?: TBody;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
  signal?: AbortSignal;
}

interface FetchResponse<T> {
  data: T;
  status: number;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

if (!process.env.NEXT_PUBLIC_BACKEND_URL) {
  throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
}

function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  const base =
    typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_BACKEND_URL!;
  const url = new URL(path.startsWith("/") ? path : `/${path}`, base);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
}

function buildLocalhostIpv4FallbackUrl(url: string): string | null {
  if (typeof window !== "undefined") return null;

  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "localhost") return null;
    parsed.hostname = "127.0.0.1";
    return parsed.toString();
  } catch {
    return null;
  }
}

async function request<TResponse, TBody = unknown>(
  path: string,
  options: RequestOptions<TBody> = {}
): Promise<FetchResponse<TResponse>> {
  const { method = "GET", body, headers = {}, params, cache, next, signal } = options;
  const url = buildUrl(path, params);

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const requestInit: RequestInit = {
    method,
    headers: isFormData ? headers : { "Content-Type": "application/json", ...headers },
    body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
    cache,
    next,
    signal,
    credentials: "include",
  };

  let response: Response;
  try {
    response = await fetch(url, requestInit);
  } catch (error) {
    const fallbackUrl = buildLocalhostIpv4FallbackUrl(url);
    if (fallbackUrl) {
      try {
        response = await fetch(fallbackUrl, requestInit);
      } catch (fallbackError) {
        throw new ApiError(503, "Network error while contacting backend", {
          path,
          url,
          fallbackUrl,
          cause: String(fallbackError),
        });
      }
    } else {
      throw new ApiError(503, "Network error while contacting backend", {
        path,
        url,
        cause: String(error),
      });
    }
  }

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = null;
    }
    const rawMessage = (errorData as { message?: unknown } | null)?.message;
    const message =
      typeof rawMessage === "string"
        ? rawMessage
        : rawMessage &&
            typeof rawMessage === "object" &&
            typeof (rawMessage as { message?: unknown }).message === "string"
          ? (rawMessage as { message: string }).message
          : `HTTP ${response.status}`;
    throw new ApiError(response.status, message, errorData);
  }

  if (response.status === 204) {
    return { data: null as TResponse, status: response.status };
  }

  const data = await response.json();
  return { data: data as TResponse, status: response.status };
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T, B = unknown>(
    path: string,
    body?: B,
    options?: Omit<RequestOptions, "method" | "body">
  ) => request<T, B>(path, { ...options, method: "POST", body }),
  put: <T, B = unknown>(
    path: string,
    body?: B,
    options?: Omit<RequestOptions, "method" | "body">
  ) => request<T, B>(path, { ...options, method: "PUT", body }),
  patch: <T, B = unknown>(
    path: string,
    body?: B,
    options?: Omit<RequestOptions, "method" | "body">
  ) => request<T, B>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
