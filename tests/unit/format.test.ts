import { describe, it, expect } from "vitest";
import { formatPrice } from "@/lib/format";

// Normalize whitespace: Intl uses NBSP / narrow NBSP as thousands separators.
const norm = (s: string) => s.replace(/\u202f|\u00a0/g, " ");

describe("formatPrice", () => {
  it("formats XOF as FCFA with space thousands separator, no decimals", () => {
    expect(norm(formatPrice(12000, "XOF"))).toBe("12 000 FCFA");
    expect(norm(formatPrice(1500000, "XOF"))).toBe("1 500 000 FCFA");
    expect(norm(formatPrice(0, "XOF"))).toBe("0 FCFA");
  });

  it("formats XAF with its own label", () => {
    expect(norm(formatPrice(2500, "XAF"))).toBe("2 500 XAF");
  });

  it("formats EUR with the euro symbol", () => {
    const out = norm(formatPrice(1234, "EUR"));
    expect(out).toContain("€");
    expect(out).toContain("1 234");
  });

  it("formats USD with the dollar symbol and 2 decimals when needed", () => {
    const out = norm(formatPrice(19.9, "USD"));
    expect(out).toMatch(/\$|US/);
    expect(out).toMatch(/19,90|19,9/);
  });

  it("formats GBP with the pound symbol", () => {
    const out = norm(formatPrice(50, "GBP"));
    expect(out).toMatch(/£|GBP/);
    expect(out).toContain("50");
  });

  it("defaults to XOF/FCFA when currency is omitted", () => {
    expect(norm(formatPrice(1000))).toBe("1 000 FCFA");
  });

  it("handles null/undefined as 0", () => {
    expect(norm(formatPrice(null))).toBe("0 FCFA");
    expect(norm(formatPrice(undefined))).toBe("0 FCFA");
  });

  it("is case-insensitive for the currency code", () => {
    expect(norm(formatPrice(500, "xof"))).toBe("500 FCFA");
    expect(norm(formatPrice(500, "eur"))).toContain("€");
  });

  it("falls back gracefully for unknown currency codes", () => {
    const out = norm(formatPrice(100, "ZZZ"));
    expect(out).toContain("100");
    expect(out).toContain("ZZZ");
  });
});
