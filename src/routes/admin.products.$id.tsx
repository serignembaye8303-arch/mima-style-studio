import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductForm } from "@/components/admin/ProductForm";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/admin/products/$id")({ component: EditProduct });

function EditProduct() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-product", id],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <Link to="/admin/products" className="inline-flex items-center gap-1 text-xs tracking-luxe text-muted-foreground hover:text-foreground"><ChevronLeft className="h-3 w-3" /> Retour</Link>
      <h1 className="font-display text-3xl">Modifier le produit</h1>
      {isLoading ? <div className="animate-pulse h-96 bg-muted rounded" /> : data && <ProductForm initial={data as any} />}
    </div>
  );
}
