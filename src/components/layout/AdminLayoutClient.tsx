"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth-client";
import { useAuthStore } from "@/stores/useAuthStore";
import { apiClient, ApiError } from "@/lib/api-client";
import { signOutWithApi } from "@/lib/sign-out";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { useSupportEvents } from "@/features/admin/support/hooks/useSupportEvents";
import type { AdminPermission, AdminPermissionsResponse } from "@/types";
import { CACHE } from "@/lib/constants/cache-config";
import { PAGINATION } from "@/lib/constants/pagination";

type Props = {
  children: React.ReactNode;
  locale: string;
};

export function AdminLayoutClient({ children, locale }: Props) {
  const router = useRouter();
  const {
    user: storeUser,
    setUser,
    clearAuth,
    permissions: cachedPermissions,
    setPermissions: storeSetPermissions,
  } = useAuthStore();
  const [resolvedUser, setResolvedUser] = useState(storeUser);
  const [permissions, setPermissions] = useState<AdminPermission[] | null>(cachedPermissions);
  const canViewSupport =
    !!permissions &&
    permissions.some(
      (p) =>
        p === "support:view" ||
        (p as unknown as { resource: string; action: string })?.resource === "support"
    );

  useSupportEvents(canViewSupport);

  const { data: supportStats } = useQuery({
    queryKey: ["admin", "support", "stats", "new"],
    queryFn: () =>
      apiClient
        .get<{
          total: number;
        }>("/api/admin/support-tickets", {
          params: { limit: PAGINATION.COUNT_ONLY_LIMIT, status: "new" },
        })
        .then((r) => r.data.total),
    staleTime: CACHE.MIN_5,
    enabled: canViewSupport,
  });

  useEffect(() => {
    async function init() {
      try {
        const [permissionsResult, sessionResult] = await Promise.all([
          apiClient.get<AdminPermissionsResponse>("/api/admin/auth/permissions"),
          storeUser ? Promise.resolve(null) : getSession(),
        ]);

        if (!permissionsResult.data.isAdmin) {
          router.push(`/${locale}/auth/login`);
          return;
        }

        setPermissions(permissionsResult.data.permissions);
        storeSetPermissions(permissionsResult.data.permissions);

        if (sessionResult?.data?.user) {
          setUser(sessionResult.data.user);
          setResolvedUser(sessionResult.data.user);
        }
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          router.push(`/${locale}/auth/login`);
        } else {
          setPermissions([]);
        }
      }
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSignOut() {
    try {
      await signOutWithApi();
    } catch {
      // keep logout UX smooth even if sign-out endpoint temporarily fails
    } finally {
      clearAuth();
      router.replace(`/${locale}/auth/login`);
      router.refresh();
    }
  }

  if (permissions === null || (!resolvedUser && !storeUser)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f2f5]">
        <div className="w-8 h-8 rounded-full border-4 border-admin-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <AdminLayout
      user={(resolvedUser ?? storeUser)!}
      locale={locale}
      permissions={permissions}
      onSignOut={handleSignOut}
      supportNewCount={supportStats ?? 0}
    >
      {children}
    </AdminLayout>
  );
}
