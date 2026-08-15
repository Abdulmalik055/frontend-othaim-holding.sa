import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/lib/auth-client";
import type { AdminPermission } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  permissions: AdminPermission[] | null;
  setUser: (user: User | null) => void;
  setPermissions: (permissions: AdminPermission[]) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      permissions: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setPermissions: (permissions) => set({ permissions }),
      clearAuth: () => set({ user: null, isAuthenticated: false, permissions: null }),
    }),
    {
      name: "cms-core-auth",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        permissions: state.permissions,
      }),
    }
  )
);
