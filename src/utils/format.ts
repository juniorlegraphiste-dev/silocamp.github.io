/**
 * Utilitaires de formatage.
 */

// Formatte un nombre en dirham marocain (MAD) avec séparateur de milliers
// adapté à la locale française : 1600 -> "1 600 MAD".
export function formatMAD(value: number): string {
  return `${value.toLocaleString("fr-FR")} MAD`;
}

// Génère un numéro de réservation lisible, ex: "CIS-7F3A9-2026".
export function generateReservationId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  const code = Array.from({ length: 5 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");

  return `CIS-${code}-2026`;
}