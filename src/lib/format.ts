const NON_ISO_CURRENCIES = new Set(["XOF", "XAF"]);

export const formatPrice = (n: number | null | undefined, currency = "XOF") => {
  const value = Number(n ?? 0);
  const cur = (currency || "XOF").toUpperCase();
  if (NON_ISO_CURRENCIES.has(cur)) {
    const label = cur === "XOF" ? "FCFA" : cur;
    return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value) + " " + label;
  }
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    return new Intl.NumberFormat("fr-FR").format(value) + " " + cur;
  }
};

export const CATEGORIES = [
  { slug: "robes", label: "Robes" },
  { slug: "ensembles", label: "Ensembles" },
  { slug: "chaussures", label: "Chaussures" },
  { slug: "sacs", label: "Sacs" },
  { slug: "accessoires", label: "Accessoires" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];
