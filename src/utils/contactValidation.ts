
import { isValidPhoneNumber } from "libphonenumber-js";

export type ContactErrors = {
  email?: string;
  phone?: string;
};

/**
 * Normalise une adresse e-mail.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Vérifie le format d'une adresse e-mail.
 * Cette vérification ne prouve pas que la boîte existe.
 */
export function validateEmail(email: string): boolean {
  const value = normalizeEmail(email);

  if (!value || value.length > 254) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

/**
 * Vérifie le format international d'un numéro.
 * Le numéro doit inclure son indicatif, par exemple +212.
 */
export function validatePhone(phone: string): boolean {
  const value = phone.trim();

  if (!value) {
    return false;
  }

  try {
    return isValidPhoneNumber(value);
  } catch {
    return false;
  }
}

/**
 * Regroupe les erreurs de format des coordonnées.
 */
export function validateContacts(
  email: string,
  phone: string,
): ContactErrors {
  const errors: ContactErrors = {};

  if (!validateEmail(email)) {
    errors.email = "Veuillez saisir une adresse e-mail valide.";
  }

  if (!validatePhone(phone)) {
    errors.phone =
      "Veuillez saisir un numéro de téléphone valide avec son indicatif.";
  }

  return errors;
}
