import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductForm } from "@/components/admin/ProductForm";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/admin/products/new")({ component: NewProduct });

function NewProduct() {
  return (
    <div className="space-y-6">
      <Link to="/admin/products" className="inline-flex items-center gap-1 text-xs tracking-luxe text-muted-foreground hover:text-foreground"><ChevronLeft className="h-3 w-3" /> Retour</Link>
      <h1 className="font-display text-3xl">Nouveau produit</h1>
      <ProductForm />
    </div>
  );
}
