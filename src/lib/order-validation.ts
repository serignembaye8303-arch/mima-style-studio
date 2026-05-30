export interface OrderFormData {
  name: string;
  phone: string;
  address: string;
  city: string;
  notes: string;
}

export interface OrderFormErrors {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  notes?: string;
}

export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\s+/g, "").replace(/[-.]/g, "");
  // Sénégal: +2217XXXXXXXX ou 7XXXXXXXX
  const regex = /^(\+221)?[7][0-9]{8}$/;
  return regex.test(cleaned);
}

export function validateOrderForm(form: OrderFormData): OrderFormErrors {
  const errors: OrderFormErrors = {};

  if (!form.name.trim()) {
    errors.name = "Le nom complet est requis";
  } else if (form.name.trim().length < 2) {
    errors.name = "Le nom doit contenir au moins 2 caractères";
  }

  if (!form.phone.trim()) {
    errors.phone = "Le numéro de téléphone est requis";
  } else if (!validatePhone(form.phone)) {
    errors.phone = "Format invalide. Ex: 77 123 45 67 ou +221 77 123 45 67";
  }

  if (form.address.trim() && !form.city.trim()) {
    errors.city = "Veuillez indiquer la ville";
  }
  if (form.city.trim() && !form.address.trim()) {
    errors.address = "Veuillez indiquer l'adresse";
  }

  if (form.notes.trim().length > 500) {
    errors.notes = "Les notes ne doivent pas dépasser 500 caractères";
  }

  return errors;
}

export function isOrderFormValid(form: OrderFormData): boolean {
  return Object.keys(validateOrderForm(form)).length === 0;
}

/**
 * Build a WhatsApp URL only if the order form is valid.
 * Returns null when validation fails — the UI must NOT open WhatsApp.
 */
export function buildWhatsAppUrlIfValid(
  form: OrderFormData,
  whatsappNumber: string,
  message: string,
): string | null {
  if (!isOrderFormValid(form)) return null;
  const num = whatsappNumber.replace(/[^0-9]/g, "");
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}
