import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  validatePhone,
  validateOrderForm,
  isOrderFormValid,
  buildWhatsAppUrlIfValid,
  type OrderFormData,
} from "@/lib/order-validation";

const baseForm = (): OrderFormData => ({
  name: "Awa Diop",
  phone: "+221 77 123 45 67",
  address: "12 rue des Almadies",
  city: "Dakar",
  notes: "",
});

describe("validatePhone (Sénégal)", () => {
  it.each([
    "+221771234567",
    "+221 77 123 45 67",
    "771234567",
    "77 123 45 67",
    "77-123-45-67",
    "78.123.45.67",
  ])("accepte %s", (v) => expect(validatePhone(v)).toBe(true));

  it.each([
    "",
    "abc",
    "12345",
    "+33 6 12 34 56 78", // pas un numéro sénégalais
    "221771234567",      // manque le +
    "+22177123456",      // trop court
    "+2217712345678",    // trop long
    "+221611234567",     // ne commence pas par 7
  ])("rejette %s", (v) => expect(validatePhone(v)).toBe(false));
});

describe("validateOrderForm", () => {
  it("renvoie une erreur quand le nom est vide", () => {
    const errors = validateOrderForm({ ...baseForm(), name: "" });
    expect(errors.name).toBeDefined();
  });

  it("renvoie une erreur quand le téléphone est invalide", () => {
    const errors = validateOrderForm({ ...baseForm(), phone: "abc" });
    expect(errors.phone).toBeDefined();
  });

  it("exige la ville si l'adresse est fournie", () => {
    const errors = validateOrderForm({ ...baseForm(), city: "" });
    expect(errors.city).toBeDefined();
  });

  it("exige l'adresse si la ville est fournie", () => {
    const errors = validateOrderForm({ ...baseForm(), address: "" });
    expect(errors.address).toBeDefined();
  });

  it("accepte un formulaire complet et valide", () => {
    expect(isOrderFormValid(baseForm())).toBe(true);
  });
});

describe("buildWhatsAppUrlIfValid — n'ouvre pas WhatsApp si invalide", () => {
  const whatsapp = "+221 77 000 00 00";
  const msg = "Bonjour";

  it("retourne null avec un téléphone invalide", () => {
    const url = buildWhatsAppUrlIfValid({ ...baseForm(), phone: "123" }, whatsapp, msg);
    expect(url).toBeNull();
  });

  it("retourne null avec une adresse partielle (ville manquante)", () => {
    const url = buildWhatsAppUrlIfValid({ ...baseForm(), city: "" }, whatsapp, msg);
    expect(url).toBeNull();
  });

  it("retourne null avec un nom manquant", () => {
    const url = buildWhatsAppUrlIfValid({ ...baseForm(), name: "" }, whatsapp, msg);
    expect(url).toBeNull();
  });

  it("retourne une URL wa.me quand tout est valide", () => {
    const url = buildWhatsAppUrlIfValid(baseForm(), whatsapp, msg);
    expect(url).toMatch(/^https:\/\/wa\.me\/221770000000\?text=/);
  });
});

describe("e2e: window.open ne doit pas être appelé si le formulaire est invalide", () => {
  let openSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    openSpy = vi.fn();
    vi.stubGlobal("window", { ...globalThis.window, open: openSpy });
  });

  afterEach(() => vi.unstubAllGlobals());

  // Simulation du handler "Commander via WhatsApp" :
  // il doit valider le formulaire AVANT d'ouvrir WhatsApp.
  function submit(form: OrderFormData) {
    const url = buildWhatsAppUrlIfValid(form, "+221770000000", "msg");
    if (!url) return false;
    window.open(url, "_blank");
    return true;
  }

  it("n'ouvre PAS WhatsApp si le téléphone est invalide", () => {
    const ok = submit({ ...baseForm(), phone: "abc" });
    expect(ok).toBe(false);
    expect(openSpy).not.toHaveBeenCalled();
  });

  it("n'ouvre PAS WhatsApp si l'adresse est incomplète", () => {
    const ok = submit({ ...baseForm(), address: "12 rue X", city: "" });
    expect(ok).toBe(false);
    expect(openSpy).not.toHaveBeenCalled();
  });

  it("n'ouvre PAS WhatsApp si le nom est manquant", () => {
    const ok = submit({ ...baseForm(), name: "" });
    expect(ok).toBe(false);
    expect(openSpy).not.toHaveBeenCalled();
  });

  it("ouvre WhatsApp quand tout est valide", () => {
    const ok = submit(baseForm());
    expect(ok).toBe(true);
    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy.mock.calls[0][0]).toMatch(/^https:\/\/wa\.me\//);
  });
});
