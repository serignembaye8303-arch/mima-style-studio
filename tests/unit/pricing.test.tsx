import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { computePriceDisplay, formatNotificationPriceLine } from "@/lib/pricing";

const norm = (s: string) => s.replace(/\u202f|\u00a0/g, " ");

// -- Mock Link + toast so we can render ProductCard / product page without a router
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...p }: any) => <a {...p}>{children}</a>,
  createFileRoute: () => () => ({}),
  notFound: () => new Error("notFound"),
}));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("@/lib/use-favorites", () => ({
  useFavorites: () => ({ isFavorite: () => false, toggle: () => {} }),
}));
vi.mock("sonner", () => ({ toast: { error: () => {}, success: () => {} } }));

import { ProductCard } from "@/components/ProductCard";

const baseProduct = {
  id: "1", slug: "robe", name: "Robe", category: "robes",
  images: ["/x.jpg"], sizes: [], colors: [], is_new: false, stock: 5,
  description: "", currency: "XOF", price: 20000, sale_price: null,
};

describe("computePriceDisplay", () => {
  it("returns single price when no sale", () => {
    const pd = computePriceDisplay({ price: 12000, currency: "XOF" });
    expect(pd.onSale).toBe(false);
    expect(pd.compare).toBeNull();
    expect(pd.discountPct).toBeNull();
    expect(norm(pd.main)).toBe("12 000 FCFA");
  });
  it("computes discount % correctly", () => {
    const pd = computePriceDisplay({ price: 20000, sale_price: 15000, currency: "XOF" });
    expect(pd.onSale).toBe(true);
    expect(pd.discountPct).toBe(25);
    expect(norm(pd.main)).toBe("15 000 FCFA");
    expect(norm(pd.compare!)).toBe("20 000 FCFA");
  });
  it("respects currency in EUR", () => {
    const pd = computePriceDisplay({ price: 100, sale_price: 80, currency: "EUR" });
    expect(pd.main).toContain("€");
    expect(pd.compare).toContain("€");
    expect(pd.discountPct).toBe(20);
  });
  it("ignores sale_price when >= price", () => {
    const pd = computePriceDisplay({ price: 100, sale_price: 100 });
    expect(pd.onSale).toBe(false);
  });
});

describe("<ProductCard>", () => {
  it("shows only the main price when not on sale (XOF)", () => {
    render(<ProductCard product={baseProduct as any} />);
    expect(norm(screen.getByTestId("price-main").textContent!)).toBe("20 000 FCFA");
    expect(screen.queryByTestId("price-compare")).toBeNull();
    expect(screen.queryByTestId("price-discount")).toBeNull();
  });
  it("shows promo, compare, discount % on sale (XOF)", () => {
    render(<ProductCard product={{ ...baseProduct, sale_price: 12000 } as any} />);
    expect(norm(screen.getByTestId("price-main").textContent!)).toBe("12 000 FCFA");
    expect(norm(screen.getByTestId("price-compare").textContent!)).toBe("20 000 FCFA");
    expect(screen.getByTestId("price-discount").textContent).toBe("-40%");
  });
  it("respects a different currency (EUR)", () => {
    render(<ProductCard product={{ ...baseProduct, currency: "EUR", price: 100, sale_price: 75 } as any} />);
    expect(screen.getByTestId("price-main").textContent).toContain("€");
    expect(screen.getByTestId("price-compare").textContent).toContain("€");
    expect(screen.getByTestId("price-discount").textContent).toBe("-25%");
  });
});

describe("formatNotificationPriceLine (💰)", () => {
  it("returns null with no price info", () => {
    expect(formatNotificationPriceLine({})).toBeNull();
  });
  it("XOF: promo + compare + discount", () => {
    const line = formatNotificationPriceLine({ price: 12000, compare_at_price: 20000, discount_percent: 40, currency: "XOF" });
    expect(line!.startsWith("💰 ")).toBe(true);
    expect(norm(line!)).toContain("12 000 FCFA");
    expect(norm(line!)).toContain("au lieu de 20 000 FCFA");
    expect(line!).toContain("-40%");
  });
  it("EUR: single promo price", () => {
    const line = formatNotificationPriceLine({ price: 49.9, currency: "EUR" });
    expect(line).toMatch(/💰/);
    expect(line).toContain("€");
  });
  it("auto-discount from compare when only compare + %", () => {
    const line = formatNotificationPriceLine({ compare_at_price: 20000, discount_percent: 30, currency: "XOF" });
    expect(norm(line!)).toContain("au lieu de 20 000 FCFA");
    expect(line!).toContain("-30%");
  });
  it("USD formatting", () => {
    const line = formatNotificationPriceLine({ price: 19.99, currency: "USD" });
    expect(line!).toMatch(/\$|US/);
  });
});
