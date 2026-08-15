// ============================================================
// Core domain types for the CMS admin.
// ============================================================

// ─── User & Auth ─────────────────────────────────────────────
import type { User, Session } from "@/lib/auth-client";
export type { User, Session };

// ─── Platform Settings ────────────────────────────────────────

export interface PlatformSettings {
  id: string;
  siteName: string;
  siteDescription?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  updatedAt: string;
}

// ─── Admin ────────────────────────────────────────────────────

export type AdminPermission =
  | "dashboard:view"
  | "cms:view"
  | "cms:create"
  | "cms:edit"
  | "cms:delete"
  | "hr:view"
  | "hr:create"
  | "hr:edit"
  | "hr:delete"
  | "settings:view"
  | "settings:edit"
  | "users:view"
  | "users:create"
  | "users:edit"
  | "users:delete"
  | "support:view"
  | "support:edit"
  | "support:delete";

export interface AdminPermissionsResponse {
  isAdmin: boolean;
  hasPermissions: boolean;
  permissions: AdminPermission[];
}

export interface AdminRole {
  id: string;
  name: string;
  nameAr: string;
  permissions: AdminPermission[];
  usersCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  userId?: string | null;
  user?: User | null;
  email: string;
  assignedTo?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Pagination ───────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

// ─── API ──────────────────────────────────────────────────────

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;
