import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth-context";

export function useFavorites() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const enabled = !!user;

  const query = useQuery({
    queryKey: ["favorites", user?.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("product_id, products(*)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const toggle = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("Connectez-vous pour ajouter aux favoris");
      const ids = (query.data ?? []).map((f) => f.product_id);
      if (ids.includes(productId)) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: user.id, product_id: productId });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorites"] }),
  });

  const ids = new Set((query.data ?? []).map((f) => f.product_id));
  return {
    favorites: query.data ?? [],
    isFavorite: (id: string) => ids.has(id),
    toggle: (id: string) => toggle.mutate(id),
    loading: query.isLoading,
  };
}
