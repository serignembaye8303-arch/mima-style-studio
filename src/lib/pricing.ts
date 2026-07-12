import { formatPrice } from "./format";

export interface PriceInput {
  price: number;
  sale_price?: number | null;
  currency?: string | null;
}

export interface PriceDisplay {
  main: string;
  compare: string | null;
  discountPct: number | null;
  onSale: boolean;
  currency: string;
  mainAmount: number;
  compareAmount: number | null;
}

/** Pure display helper shared by ProductCard and product detail page. */
export function computePriceDisplay(p: PriceInput): PriceDisplay {
  const currency = (p.currency ?? "XOF").toUpperCase();
  const onSale = p.sale_price != null && Number(p.sale_price) < Number(p.price);
  const mainAmount = onSale ? Number(p.sale_price) : Number(p.price);
  const compareAmount = onSale ? Number(p.price) : null;
  const discountPct =
    onSale && Number(p.price) > 0
      ? Math.round(((Number(p.price) - Number(p.sale_price)) / Number(p.price)) * 100)
      : null;
  return {
    main: formatPrice(mainAmount, currency),
    compare: compareAmount != null ? formatPrice(compareAmount, currency) : null,
    discountPct,
    onSale,
    currency,
    mainAmount,
    compareAmount,
  };
}

/** Money used in notification bodies — kept consistent with formatPrice. */
export function formatNotificationPriceLine(input: {
  price?: number | null;
  compare_at_price?: number | null;
  discount_percent?: number | null;
  currency?: string | null;
}): string | null {
  const { price, compare_at_price, discount_percent } = input;
  const currency = (input.currency ?? "XOF").toUpperCase();
  if (price == null && compare_at_price == null) return null;
  const parts: string[] = [];
  if (price != null) parts.push(formatPrice(price, currency));
  if (compare_at_price != null && (price == null || compare_at_price > price)) {
    let extra = `au lieu de ${formatPrice(compare_at_price, currency)}`;
    if (discount_percent) extra += ` — -${Math.round(discount_percent)}%`;
    parts.push(`(${extra})`);
  } else if (discount_percent) {
    parts.push(`(-${Math.round(discount_percent)}%)`);
  }
  return "💰 " + parts.join(" ");
}
