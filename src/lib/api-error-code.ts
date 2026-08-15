export function getApiErrorCode(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const errorData = data as { code?: unknown; message?: unknown };
  if (typeof errorData.code === "string") return errorData.code;
  if (!errorData.message || typeof errorData.message !== "object") return undefined;
  const nestedCode = (errorData.message as { code?: unknown }).code;
  return typeof nestedCode === "string" ? nestedCode : undefined;
}
