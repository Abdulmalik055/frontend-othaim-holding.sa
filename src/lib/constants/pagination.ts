export const PAGINATION = {
  /** Fetch one item only when the UI needs the response `total` count. */
  COUNT_ONLY_LIMIT: 1,

  /** Backend default page size when a screen has no more specific limit. */
  DEFAULT_LIMIT: 20,

  /** Full-page admin tables such as CMS, support, users, and roles. */
  TABLE_LIMIT: 15,

  /** Compact preview tables shown inside the dashboard. */
  DASHBOARD_PREVIEW_LIMIT: 5,

  /** Select/dropdown or lightweight lookup requests that should load a fuller list at once. */
  SELECT_LIMIT: 100,
} as const

export type PaginationKey = keyof typeof PAGINATION
