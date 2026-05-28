import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth-context";

export type AppRole = "super_admin" | "admin" | "manager" | "client";

export function useRoles() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["roles", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<AppRole[]> => {
      if (!user) return [];
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      return (data ?? []).map((r) => r.role as AppRole);
    },
  });
}

export function useIsStaff() {
  const { data: roles, isLoading } = useRoles();
  const isStaff = !!roles?.some((r) => r === "admin" || r === "super_admin" || r === "manager");
  return { isStaff, isSuperAdmin: !!roles?.includes("super_admin"), isLoading, roles: roles ?? [] };
}
