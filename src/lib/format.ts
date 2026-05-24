export const formatPrice = (n: number, currency = "XOF") => {
  if (currency === "XOF") {
    return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n) + " FCFA";
  }
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(n);
};

export const CATEGORIES = [
  { slug: "robes", label: "Robes" },
  { slug: "ensembles", label: "Ensembles" },
  { slug: "chaussures", label: "Chaussures" },
  { slug: "sacs", label: "Sacs" },
  { slug: "accessoires", label: "Accessoires" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];
