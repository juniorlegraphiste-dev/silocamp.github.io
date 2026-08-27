/**
 * =========================================================
 * TICKET SERVICE — SILOCAMP
 * =========================================================
 *
 * Gestion :
 * - création des billets
 * - stockage local
 * - disponibilité
 * - validation
 * - utilisation
 * - annulation
 * - recherche
 * - statistiques
 * - vérification QR Code
 *
 * STOCKAGE ACTUEL :
 * localStorage
 *
 * CAPACITÉ :
 * 1200 PLACES
 *
 * RÈGLES :
 * - 1 participant = 1 place
 * - 1 réservation = 1 billet
 * - e-mail unique
 * - téléphone unique
 * - réservation unique
 * - billet VALID = place occupée
 * - billet USED = place occupée
 * - billet CANCELLED = place libérée
 *
 * IMPORTANT :
 * Cette version est adaptée à Vite + React.
 *
 * Pour une vraie production multi-appareils,
 * le localStorage devra être remplacé par une
 * base de données + API.
 * =========================================================
 */

/* =========================================================
   CONSTANTES
========================================================= */

/**
 * Clé utilisée dans localStorage.
 */
const STORAGE_KEY = "silocamp-tickets";

/**
 * Nombre maximum de participants.
 */
const MAX_TICKETS = 1200;

/**
 * Export public de la capacité.
 */
export const TICKET_LIMIT = MAX_TICKETS;

/**
 * Route publique de vérification.
 *
 * Exemple :
 * /ticket/verify?token=XXXXXXXX
 */
const TICKET_VERIFY_PATH = "/ticket/verify";

/* =========================================================
   TYPES
========================================================= */

/**
 * Statut possible d'un billet.
 */
export type TicketStatus =
  | "VALID"
  | "USED"
  | "CANCELLED";

/**
 * Structure complète d'un billet.
 */
export type Ticket = {
  /**
   * Identifiant interne.
   */
  id: string;

  /**
   * Numéro public du billet.
   *
   * Exemple :
   * SILO-2026-A7F82C91
   */
  ticketNumber: string;

  /**
   * Prénom du participant.
   */
  firstName?: string;

  /**
   * Nom du participant.
   */
  lastName?: string;

  /**
   * Nom complet.
   *
   * Conservé pour compatibilité.
   */
  participantName: string;

  /**
   * Adresse e-mail.
   */
  email: string;

  /**
   * Numéro de téléphone.
   */
  phone?: string;

  /**
   * Identifiant unique de réservation.
   */
  reservationId: string;

  /**
   * Token privé utilisé pour la vérification QR.
   */
  verificationToken: string;

  /**
   * Identifiant de l'événement.
   */
  eventId?: string;

  /**
   * Nom de l'événement.
   */
  eventTitle: string;

  /**
   * Date affichée.
   */
  dateLabel: string;

  /**
   * Heure de l'événement.
   */
  time: string;

  /**
   * Durée de l'événement.
   */
  duration?: string;

  /**
   * Lieu.
   */
  venue: string;

  /**
   * Ville.
   */
  city: string;

  /**
   * Quantité réservée.
   *
   * SiloCamp :
   * toujours 1.
   */
  quantity: number;

  /**
   * Statut actuel du billet.
   */
  status: TicketStatus;

  /**
   * Date de création.
   */
  createdAt: string;

  /**
   * Date d'utilisation.
   */
  usedAt?: string;

  /**
   * Date d'annulation.
   */
  cancelledAt?: string;
};

/* =========================================================
   DONNÉES DE CRÉATION
========================================================= */

export type CreateTicketInput = {
  /**
   * Prénom.
   */
  firstName?: string;

  /**
   * Nom.
   */
  lastName?: string;

  /**
   * Nom complet.
   *
   * Conservé pour compatibilité.
   */
  participantName?: string;

  /**
   * E-mail.
   */
  email: string;

  /**
   * Téléphone.
   */
  phone?: string;

  /**
   * Identifiant unique de réservation.
   */
  reservationId: string;

  /**
   * Identifiant événement.
   */
  eventId?: string;

  /**
   * Nom événement.
   */
  eventTitle: string;

  /**
   * Date.
   */
  dateLabel: string;

  /**
   * Heure.
   */
  time: string;

  /**
   * Durée.
   */
  duration?: string;

  /**
   * Lieu.
   */
  venue: string;

  /**
   * Ville.
   */
  city: string;

  /**
   * Quantité.
   *
   * SiloCamp :
   * toujours 1.
   */
  quantity?: number;
};

/* =========================================================
   RÉSULTAT DE VALIDATION
========================================================= */

export type TicketValidationResult =
  | {
      valid: true;

      ticket: Ticket;

      message: string;
    }
  | {
      valid: false;

      ticket?: Ticket;

      reason:
        | "NOT_FOUND"
        | "CANCELLED"
        | "USED";

      message: string;
    };

/* =========================================================
   DONNÉES QR CODE
========================================================= */

/**
 * Données utiles pour le composant QR.
 *
 * IMPORTANT :
 * Le QR Code lui-même doit idéalement contenir
 * uniquement verificationUrl.
 */
export type TicketQRCodeData = {
  ticketNumber: string;

  firstName: string;

  lastName: string;

  participantName: string;

  phone: string;

  email: string;

  reservationId: string;

  verificationToken: string;

  verificationUrl: string;
};

/* =========================================================
   UTILITAIRES
========================================================= */

/**
 * Génère un identifiant interne unique.
 */
function generateId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return (
    Date.now().toString(36) +
    Math.random()
      .toString(36)
      .substring(2, 12)
  );
}

/**
 * Génère un token privé de vérification.
 */
function generateVerificationToken(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto
      .randomUUID()
      .replace(/-/g, "");
  }

  return (
    Date.now().toString(36) +
    Math.random()
      .toString(36)
      .substring(2, 18)
  );
}

/**
 * Génère le numéro public du billet.
 *
 * Exemple :
 * SILO-2026-A7F82C91
 */
function generateTicketNumber(): string {
  const year = new Date().getFullYear();

  const randomPart =
    generateVerificationToken()
      .substring(0, 8)
      .toUpperCase();

  return `SILO-${year}-${randomPart}`;
}

/**
 * Normalise un e-mail.
 */
function normalizeEmail(
  email: string,
): string {
  return email
    .trim()
    .toLowerCase();
}

/**
 * Normalise un téléphone.
 */
function normalizePhone(
  phone: string,
): string {
  return phone
    .replace(/[^\d+]/g, "")
    .trim();
}

/**
 * Normalise un texte.
 */
function normalizeText(
  value: string,
): string {
  return value.trim();
}

/* =========================================================
   LECTURE DES BILLETS
========================================================= */

/**
 * Retourne tous les billets enregistrés.
 */
export function getTickets(): Ticket[] {
  if (
    typeof window === "undefined"
  ) {
    return [];
  }

  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY,
      );

    if (!raw) {
      return [];
    }

    const parsed: unknown =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as Ticket[];
  } catch (error) {
    console.error(
      "[SiloCamp] Impossible de lire les billets :",
      error,
    );

    return [];
  }
}

/* =========================================================
   SAUVEGARDE
========================================================= */

/**
 * Sauvegarde les billets dans localStorage.
 */
function saveTickets(
  tickets: Ticket[],
): void {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(tickets),
    );
  } catch (error) {
    console.error(
      "[SiloCamp] Impossible de sauvegarder les billets :",
      error,
    );

    throw new Error(
      "Impossible de sauvegarder les billets.",
    );
  }
}

/* =========================================================
   PLACES RÉSERVÉES
========================================================= */

/**
 * Retourne le nombre de places occupées.
 *
 * VALID + USED = occupées
 * CANCELLED = libérées
 */
export function getTicketsReserved(): number {
  const tickets =
    getTickets();

  return tickets
    .filter(
      (ticket) =>
        ticket.status === "VALID" ||
        ticket.status === "USED",
    )
    .reduce(
      (total, ticket) =>
        total + ticket.quantity,
      0,
    );
}

/* =========================================================
   PLACES RESTANTES
========================================================= */

/**
 * Retourne le nombre de places restantes.
 */
export function getTicketsRemaining(): number {
  return Math.max(
    0,
    MAX_TICKETS -
      getTicketsReserved(),
  );
}

/* =========================================================
   DISPONIBILITÉ
========================================================= */

/**
 * Vérifie si une quantité donnée est disponible.
 *
 * Règle SiloCamp :
 * 1 participant = 1 billet.
 */
export function checkTicketAvailability(
  quantity: number,
): boolean {
  if (
    !Number.isInteger(quantity)
  ) {
    return false;
  }

  if (quantity <= 0) {
    return false;
  }

  /**
   * SiloCamp :
   * une seule place par réservation.
   */
  if (quantity !== 1) {
    return false;
  }

  return (
    getTicketsRemaining() >=
    quantity
  );
}

/* =========================================================
   CRÉATION DU BILLET
========================================================= */

/**
 * Crée un nouveau billet.
 */
export function createTicket(
  input: CreateTicketInput,
): Ticket {
  const quantity =
    input.quantity ?? 1;

  /* -------------------------------------------------------
     QUANTITÉ
  ------------------------------------------------------- */

  if (
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    throw new Error(
      "La quantité de billets est invalide.",
    );
  }

  if (quantity !== 1) {
    throw new Error(
      "Un seul billet peut être réservé par participant.",
    );
  }

  /* -------------------------------------------------------
     STOCK
  ------------------------------------------------------- */

  if (
    !checkTicketAvailability(
      quantity,
    )
  ) {
    throw new Error(
      "Il n'y a plus suffisamment de places disponibles.",
    );
  }

  /* -------------------------------------------------------
     RÉSERVATION
  ------------------------------------------------------- */

  const reservationId =
    normalizeText(
      input.reservationId,
    );

  if (!reservationId) {
    throw new Error(
      "L'identifiant de réservation est obligatoire.",
    );
  }

  /* -------------------------------------------------------
     IDENTITÉ
  ------------------------------------------------------- */

  const firstName =
    normalizeText(
      input.firstName ?? "",
    );

  const lastName =
    normalizeText(
      input.lastName ?? "",
    );

  const participantName =
    normalizeText(
      input.participantName ?? "",
    ) ||
    [firstName, lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

  if (!participantName) {
    throw new Error(
      "Le nom du participant est obligatoire.",
    );
  }

  /* -------------------------------------------------------
     EMAIL
  ------------------------------------------------------- */

  const email =
    normalizeEmail(input.email);

  if (!email) {
    throw new Error(
      "L'adresse e-mail est obligatoire.",
    );
  }

  /* -------------------------------------------------------
     TÉLÉPHONE
  ------------------------------------------------------- */

  const phone = input.phone
    ? normalizePhone(input.phone)
    : undefined;

  /* -------------------------------------------------------
     ÉVÉNEMENT
  ------------------------------------------------------- */

  const eventTitle =
    normalizeText(
      input.eventTitle,
    );

  const dateLabel =
    normalizeText(
      input.dateLabel,
    );

  const time =
    normalizeText(input.time);

  const venue =
    normalizeText(input.venue);

  const city =
    normalizeText(input.city);

  if (!eventTitle) {
    throw new Error(
      "Le nom de l'événement est obligatoire.",
    );
  }

  if (!dateLabel) {
    throw new Error(
      "La date de l'événement est obligatoire.",
    );
  }

  if (!time) {
    throw new Error(
      "L'heure de l'événement est obligatoire.",
    );
  }

  if (!venue) {
    throw new Error(
      "Le lieu de l'événement est obligatoire.",
    );
  }

  if (!city) {
    throw new Error(
      "La ville de l'événement est obligatoire.",
    );
  }

  /* -------------------------------------------------------
     LECTURE DES BILLETS EXISTANTS
  ------------------------------------------------------- */

  const tickets =
    getTickets();

  /* -------------------------------------------------------
     PROTECTION CAPACITÉ
  ------------------------------------------------------- */

  const reserved =
    tickets
      .filter(
        (ticket) =>
          ticket.status === "VALID" ||
          ticket.status === "USED",
      )
      .reduce(
        (total, ticket) =>
          total + ticket.quantity,
        0,
      );

  if (
    reserved + quantity >
    MAX_TICKETS
  ) {
    throw new Error(
      `La capacité maximale de ${MAX_TICKETS} participants a été atteinte.`,
    );
  }

  /* -------------------------------------------------------
     UNICITÉ RÉSERVATION
  ------------------------------------------------------- */

  const existingReservation =
    tickets.find(
      (ticket) =>
        ticket.reservationId ===
        reservationId,
    );

  if (existingReservation) {
    throw new Error(
      "Cet identifiant de réservation existe déjà.",
    );
  }

  /* -------------------------------------------------------
     UNICITÉ EMAIL
  ------------------------------------------------------- */

  const existingEmail =
    tickets.find(
      (ticket) =>
        normalizeEmail(
          ticket.email,
        ) === email,
    );

  if (existingEmail) {
    throw new Error(
      "Cette adresse e-mail a déjà été utilisée pour une participation.",
    );
  }

  /* -------------------------------------------------------
     UNICITÉ TÉLÉPHONE
  ------------------------------------------------------- */

  if (phone) {
    const existingPhone =
      tickets.find(
        (ticket) => {
          if (!ticket.phone) {
            return false;
          }

          return (
            normalizePhone(
              ticket.phone,
            ) === phone
          );
        },
      );

    if (existingPhone) {
      throw new Error(
        "Ce numéro de téléphone a déjà été utilisé pour une participation.",
      );
    }
  }

  /* -------------------------------------------------------
     NUMÉRO DU BILLET
  ------------------------------------------------------- */

  let ticketNumber = "";

  let attempts = 0;

  do {
    ticketNumber =
      generateTicketNumber();

    attempts++;

    if (attempts >= 20) {
      throw new Error(
        "Impossible de générer un numéro de billet unique. Veuillez réessayer.",
      );
    }
  } while (
    tickets.some(
      (ticket) =>
        ticket.ticketNumber ===
        ticketNumber,
    )
  );

  /* -------------------------------------------------------
     TOKEN DE VÉRIFICATION
  ------------------------------------------------------- */

  let verificationToken = "";

  let tokenAttempts = 0;

  do {
    verificationToken =
      generateVerificationToken();

    tokenAttempts++;

    if (tokenAttempts >= 20) {
      throw new Error(
        "Impossible de générer un token de vérification unique. Veuillez réessayer.",
      );
    }
  } while (
    tickets.some(
      (ticket) =>
        ticket.verificationToken ===
        verificationToken,
    )
  );

  /* -------------------------------------------------------
     CRÉATION
  ------------------------------------------------------- */

  const ticket: Ticket = {
    id: generateId(),

    ticketNumber,

    firstName,

    lastName,

    participantName,

    email,

    phone,

    reservationId,

    verificationToken,

    eventId: input.eventId,

    eventTitle,

    dateLabel,

    time,

    duration: input.duration
      ? normalizeText(
          input.duration,
        )
      : undefined,

    venue,

    city,

    quantity: 1,

    status: "VALID",

    createdAt:
      new Date().toISOString(),
  };

  /* -------------------------------------------------------
     SAUVEGARDE
  ------------------------------------------------------- */

  tickets.push(ticket);

  saveTickets(tickets);

  return ticket;
}

/* =========================================================
   URL DE VÉRIFICATION QR
========================================================= */

/**
 * Génère l'URL publique du QR Code.
 *
 * Exemple :
 *
 * https://monsite.com/ticket/verify?token=abc123
 */
export function getTicketVerificationUrl(
  ticket: Ticket,
): string {
  const token =
    encodeURIComponent(
      ticket.verificationToken,
    );

  /**
   * Navigateur :
   * utilise automatiquement le domaine
   * actuel.
   */
  if (
    typeof window !== "undefined"
  ) {
    return `${window.location.origin}${TICKET_VERIFY_PATH}?token=${token}`;
  }

  /**
   * Fallback SSR / génération hors navigateur.
   *
   * Pour Vite, cette partie est rarement utilisée.
   */
  return `${TICKET_VERIFY_PATH}?token=${token}`;
}

/* =========================================================
   DONNÉES QR CODE
========================================================= */

/**
 * Retourne les informations utiles
 * pour l'affichage ou la génération du QR Code.
 *
 * IMPORTANT :
 * Le QR Code doit utiliser :
 *
 * data.verificationUrl
 *
 * et non toutes les données personnelles.
 */
export function getTicketQRCodeData(
  ticket: Ticket,
): TicketQRCodeData {
  return {
    ticketNumber:
      ticket.ticketNumber,

    firstName:
      ticket.firstName ?? "",

    lastName:
      ticket.lastName ?? "",

    participantName:
      ticket.participantName,

    phone:
      ticket.phone ?? "",

    email:
      ticket.email,

    reservationId:
      ticket.reservationId,

    verificationToken:
      ticket.verificationToken,

    verificationUrl:
      getTicketVerificationUrl(
        ticket,
      ),
  };
}

/* =========================================================
   RECHERCHE PAR ID
========================================================= */

/**
 * Recherche un billet par son ID interne.
 */
export function getTicketById(
  id: string,
): Ticket | null {
  const normalizedId =
    id.trim();

  if (!normalizedId) {
    return null;
  }

  const tickets =
    getTickets();

  return (
    tickets.find(
      (ticket) =>
        ticket.id ===
        normalizedId,
    ) ?? null
  );
}

/* =========================================================
   RECHERCHE PAR NUMÉRO
========================================================= */

/**
 * Recherche un billet par son numéro public.
 */
export function getTicketByNumber(
  ticketNumber: string,
): Ticket | null {
  const normalizedNumber =
    ticketNumber.trim();

  if (!normalizedNumber) {
    return null;
  }

  const tickets =
    getTickets();

  return (
    tickets.find(
      (ticket) =>
        ticket.ticketNumber ===
        normalizedNumber,
    ) ?? null
  );
}

/* =========================================================
   RECHERCHE PAR RÉSERVATION
========================================================= */

/**
 * Recherche par identifiant de réservation.
 */
export function getTicketByReservationId(
  reservationId: string,
): Ticket | null {
  const normalizedId =
    reservationId.trim();

  if (!normalizedId) {
    return null;
  }

  const tickets =
    getTickets();

  return (
    tickets.find(
      (ticket) =>
        ticket.reservationId ===
        normalizedId,
    ) ?? null
  );
}

/* =========================================================
   RECHERCHE PAR EMAIL
========================================================= */

/**
 * Recherche par e-mail.
 */
export function getTicketByEmail(
  email: string,
): Ticket | null {
  const normalizedEmail =
    normalizeEmail(email);

  if (!normalizedEmail) {
    return null;
  }

  const tickets =
    getTickets();

  return (
    tickets.find(
      (ticket) =>
        normalizeEmail(
          ticket.email,
        ) === normalizedEmail,
    ) ?? null
  );
}

/* =========================================================
   RECHERCHE PAR TÉLÉPHONE
========================================================= */

/**
 * Recherche par téléphone.
 */
export function getTicketByPhone(
  phone: string,
): Ticket | null {
  const normalizedPhone =
    normalizePhone(phone);

  if (!normalizedPhone) {
    return null;
  }

  const tickets =
    getTickets();

  return (
    tickets.find(
      (ticket) => {
        if (!ticket.phone) {
          return false;
        }

        return (
          normalizePhone(
            ticket.phone,
          ) === normalizedPhone
        );
      },
    ) ?? null
  );
}

/* =========================================================
   RECHERCHE PAR TOKEN
========================================================= */

/**
 * Recherche par token QR.
 */
export function getTicketByVerificationToken(
  token: string,
): Ticket | null {
  const normalizedToken =
    token.trim();

  if (!normalizedToken) {
    return null;
  }

  const tickets =
    getTickets();

  return (
    tickets.find(
      (ticket) =>
        ticket.verificationToken ===
        normalizedToken,
    ) ?? null
  );
}

/* =========================================================
   VALIDATION INTERNE
========================================================= */

/**
 * Valide l'état d'un billet.
 */
function validateTicketObject(
  ticket: Ticket,
): TicketValidationResult {
  /* -------------------------------------------------------
     ANNULÉ
  ------------------------------------------------------- */

  if (
    ticket.status ===
    "CANCELLED"
  ) {
    return {
      valid: false,

      ticket,

      reason: "CANCELLED",

      message:
        "Ce billet a été annulé.",
    };
  }

  /* -------------------------------------------------------
     DÉJÀ UTILISÉ
  ------------------------------------------------------- */

  if (
    ticket.status === "USED"
  ) {
    return {
      valid: false,

      ticket,

      reason: "USED",

      message:
        "Ce billet a déjà été utilisé.",
    };
  }

  /* -------------------------------------------------------
     VALIDE
  ------------------------------------------------------- */

  return {
    valid: true,

    ticket,

    message:
      "Ce billet est valide.",
  };
}

/* =========================================================
   VALIDATION PAR NUMÉRO
========================================================= */

/**
 * Vérifie un billet par son numéro.
 */
export function validateTicket(
  ticketNumber: string,
): TicketValidationResult {
  const ticket =
    getTicketByNumber(
      ticketNumber,
    );

  if (!ticket) {
    return {
      valid: false,

      reason: "NOT_FOUND",

      message:
        "Billet introuvable.",
    };
  }

  return validateTicketObject(
    ticket,
  );
}

/* =========================================================
   VALIDATION PAR TOKEN QR
========================================================= */

/**
 * Vérifie un billet par son token QR.
 */
export function validateTicketByToken(
  token: string,
): TicketValidationResult {
  const ticket =
    getTicketByVerificationToken(
      token,
    );

  if (!ticket) {
    return {
      valid: false,

      reason: "NOT_FOUND",

      message:
        "Billet introuvable.",
    };
  }

  return validateTicketObject(
    ticket,
  );
}

/* =========================================================
   UTILISER LE BILLET PAR NUMÉRO
========================================================= */

/**
 * Marque un billet comme utilisé.
 */
export function useTicket(
  ticketNumber: string,
): TicketValidationResult {
  const normalizedNumber =
    ticketNumber.trim();

  if (!normalizedNumber) {
    return {
      valid: false,

      reason: "NOT_FOUND",

      message:
        "Numéro de billet invalide.",
    };
  }

  /* -------------------------------------------------------
     VALIDATION
  ------------------------------------------------------- */

  const validation =
    validateTicket(
      normalizedNumber,
    );

  if (!validation.valid) {
    return validation;
  }

  /* -------------------------------------------------------
     RÉCUPÉRATION
  ------------------------------------------------------- */

  const tickets =
    getTickets();

  const index =
    tickets.findIndex(
      (ticket) =>
        ticket.ticketNumber ===
        normalizedNumber,
    );

  if (index === -1) {
    return {
      valid: false,

      reason: "NOT_FOUND",

      message:
        "Billet introuvable.",
    };
  }

  /* -------------------------------------------------------
     UTILISATION
  ------------------------------------------------------- */

  const updatedTicket: Ticket = {
    ...tickets[index],

    status: "USED",

    usedAt:
      new Date().toISOString(),
  };

  tickets[index] =
    updatedTicket;

  saveTickets(tickets);

  return {
    valid: true,

    ticket: updatedTicket,

    message:
      "Billet validé et enregistré comme utilisé.",
  };
}

/* =========================================================
   UTILISER PAR TOKEN QR
========================================================= */

/**
 * Marque un billet QR comme utilisé.
 */
export function useTicketByToken(
  token: string,
): TicketValidationResult {
  const normalizedToken =
    token.trim();

  if (!normalizedToken) {
    return {
      valid: false,

      reason: "NOT_FOUND",

      message:
        "Code de vérification invalide.",
    };
  }

  /* -------------------------------------------------------
     VALIDATION
  ------------------------------------------------------- */

  const validation =
    validateTicketByToken(
      normalizedToken,
    );

  if (!validation.valid) {
    return validation;
  }

  /* -------------------------------------------------------
     RÉCUPÉRATION
  ------------------------------------------------------- */

  const tickets =
    getTickets();

  const index =
    tickets.findIndex(
      (ticket) =>
        ticket.verificationToken ===
        normalizedToken,
    );

  if (index === -1) {
    return {
      valid: false,

      reason: "NOT_FOUND",

      message:
        "Billet introuvable.",
    };
  }

  /* -------------------------------------------------------
     UTILISATION
  ------------------------------------------------------- */

  const updatedTicket: Ticket = {
    ...tickets[index],

    status: "USED",

    usedAt:
      new Date().toISOString(),
  };

  tickets[index] =
    updatedTicket;

  saveTickets(tickets);

  return {
    valid: true,

    ticket: updatedTicket,

    message:
      "Billet validé et enregistré comme utilisé.",
  };
}

/* =========================================================
   ANNULATION
========================================================= */

/**
 * Annule un billet.
 *
 * Un billet USED ne peut pas être annulé.
 *
 * Un billet CANCELLED ne peut pas être
 * annulé une seconde fois.
 */
export function cancelTicket(
  ticketNumber: string,
): boolean {
  const normalizedNumber =
    ticketNumber.trim();

  if (!normalizedNumber) {
    return false;
  }

  const tickets =
    getTickets();

  const index =
    tickets.findIndex(
      (ticket) =>
        ticket.ticketNumber ===
        normalizedNumber,
    );

  if (index === -1) {
    return false;
  }

  /* -------------------------------------------------------
     DÉJÀ UTILISÉ
  ------------------------------------------------------- */

  if (
    tickets[index].status ===
    "USED"
  ) {
    return false;
  }

  /* -------------------------------------------------------
     DÉJÀ ANNULÉ
  ------------------------------------------------------- */

  if (
    tickets[index].status ===
    "CANCELLED"
  ) {
    return false;
  }

  /* -------------------------------------------------------
     ANNULATION
  ------------------------------------------------------- */

  tickets[index] = {
    ...tickets[index],

    status: "CANCELLED",

    cancelledAt:
      new Date().toISOString(),
  };

  saveTickets(tickets);

  return true;
}

/* =========================================================
   STATISTIQUES
========================================================= */

export type TicketStats = {
  /**
   * Nombre total de billets créés,
   * y compris les billets annulés.
   */
  totalTickets: number;

  /**
   * Billets actuellement valides.
   */
  validTickets: number;

  /**
   * Billets déjà utilisés.
   */
  usedTickets: number;

  /**
   * Billets annulés.
   */
  cancelledTickets: number;

  /**
   * Places actuellement réservées.
   *
   * VALID + USED
   */
  reserved: number;

  /**
   * Places déjà utilisées.
   */
  used: number;

  /**
   * Places restantes.
   */
  remaining: number;

  /**
   * Capacité totale.
   */
  capacity: number;

  /**
   * Taux de remplissage.
   */
  occupancyRate: number;
};

/**
 * Retourne les statistiques globales.
 */
export function getTicketStats(): TicketStats {
  const tickets =
    getTickets();

  /* -------------------------------------------------------
     VALIDES
  ------------------------------------------------------- */

  const validTickets =
    tickets.filter(
      (ticket) =>
        ticket.status === "VALID",
    );

  /* -------------------------------------------------------
     UTILISÉS
  ------------------------------------------------------- */

  const usedTickets =
    tickets.filter(
      (ticket) =>
        ticket.status === "USED",
    );

  /* -------------------------------------------------------
     ANNULÉS
  ------------------------------------------------------- */

  const cancelledTickets =
    tickets.filter(
      (ticket) =>
        ticket.status ===
        "CANCELLED",
    );

  /* -------------------------------------------------------
     PLACES RÉSERVÉES
  ------------------------------------------------------- */

  const reserved =
    tickets
      .filter(
        (ticket) =>
          ticket.status ===
            "VALID" ||
          ticket.status ===
            "USED",
      )
      .reduce(
        (total, ticket) =>
          total + ticket.quantity,
        0,
      );

  /* -------------------------------------------------------
     PLACES UTILISÉES
  ------------------------------------------------------- */

  const used =
    usedTickets.reduce(
      (total, ticket) =>
        total + ticket.quantity,
      0,
    );

  /* -------------------------------------------------------
     PLACES RESTANTES
  ------------------------------------------------------- */

  const remaining =
    Math.max(
      0,
      MAX_TICKETS -
        reserved,
    );

  /* -------------------------------------------------------
     TAUX DE REMPLISSAGE
  ------------------------------------------------------- */

  const occupancyRate =
    MAX_TICKETS > 0
      ? Number(
          (
            (reserved /
              MAX_TICKETS) *
            100
          ).toFixed(2),
        )
      : 0;

  /* -------------------------------------------------------
     RETOUR
  ------------------------------------------------------- */

  return {
    totalTickets:
      tickets.length,

    validTickets:
      validTickets.length,

    usedTickets:
      usedTickets.length,

    cancelledTickets:
      cancelledTickets.length,

    reserved,

    used,

    remaining,

    capacity:
      MAX_TICKETS,

    occupancyRate,
  };
}

/* =========================================================
   RESET
========================================================= */

/**
 * Supprime tous les billets.
 *
 * ⚠️ À utiliser uniquement pendant les tests
 * ou une réinitialisation complète.
 */
export function resetTickets(): void {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  localStorage.removeItem(
    STORAGE_KEY,
  );
}