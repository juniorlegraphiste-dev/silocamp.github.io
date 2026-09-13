/* =========================================================
   TYPES
========================================================= */

export type TicketStatus = "VALID" | "USED" | "CANCELLED";

export type Ticket = {
  id: string;

  ticketNumber: string;

  verificationToken?: string;

  firstName?: string | null;

  lastName?: string | null;

  participantName: string;

  email: string;

  phone?: string | null;

  reservationId?: string | null;

  eventId?: string | null;

  eventTitle: string;

  dateLabel: string;

  time: string;

  duration?: string | null;

  venue: string;

  city: string;

  /**
   * Nombre réel de places consommées.
   *
   * 1 participant principal
   * + enfants de 12 ans et plus
   *
   * Les enfants de moins de 12 ans
   * ne consomment pas de place.
   */
  quantity: number;

  /**
   * Enfants accompagnateurs de moins de 12 ans.
   *
   * Informatif uniquement.
   */
  childrenUnder12: number;

  /**
   * Enfants de 12 ans et plus.
   *
   * Chaque enfant consomme une place.
   */
  children12Plus: number;

  status: TicketStatus;

  createdAt: string | Date;

  usedAt?: string | Date | null;

  cancelledAt?: string | Date | null;
};

/* =========================================================
   CREATE INPUT
========================================================= */

export type CreateTicketInput = {
  firstName?: string;

  lastName?: string;

  participantName?: string;

  email: string;

  phone?: string;

  reservationId?: string;

  eventId?: string;

  eventTitle: string;

  dateLabel: string;

  time: string;

  duration?: string;

  venue: string;

  city: string;

  quantity?: number;

  childrenUnder12?: number;

  children12Plus?: number;
};

/* =========================================================
   STATS
========================================================= */

export type TicketStats = {
  capacity: number;

  totalTickets: number;

  validTickets: number;

  usedTickets: number;

  cancelledTickets: number;

  /**
   * Nombre total de places consommées.
   */
  reserved: number;

  /**
   * Nombre de places utilisées.
   */
  used: number;

  remaining: number;
};

/* =========================================================
   API CONFIG
========================================================= */

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || window.location.origin
).replace(/\/$/, "");

const API_URL = `${API_BASE_URL}/api/tickets`;

/* =========================================================
   NORMALIZATION
========================================================= */

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string): string {
  return value.replace(/[^\d+]/g, "").trim();
}

function normalizeQuantity(value: unknown): number {
  const quantity = Math.floor(Number(value ?? 0));

  return Number.isFinite(quantity) ? Math.max(0, quantity) : 0;
}

function calculateConsumedPlaces(children12Plus: number): number {
  return 1 + children12Plus;
}

/* =========================================================
   NORMALIZE TICKET
========================================================= */

function normalizeTicket(ticket: Ticket): Ticket {
  const childrenUnder12 = normalizeQuantity(ticket.childrenUnder12);

  const children12Plus = normalizeQuantity(ticket.children12Plus);

  const quantity =
    normalizeQuantity(ticket.quantity) ||
    calculateConsumedPlaces(children12Plus);

  return {
    ...ticket,

    quantity,

    childrenUnder12,

    children12Plus,

    usedAt: ticket.usedAt ?? null,

    cancelledAt: ticket.cancelledAt ?? null,
  };
}

/* =========================================================
   PARSE JSON
========================================================= */

async function parseJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") || "";

  const text = await response.text();

  if (!text.trim()) {
    return null;
  }

  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error(
      `Réponse serveur non JSON (${response.status}) : ${text.slice(0, 300)}`,
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Le serveur a renvoyé un JSON invalide (${response.status}).`,
    );
  }
}

/* =========================================================
   API ERROR
========================================================= */

function getApiError(data: unknown, fallback: string): string {
  if (typeof data === "object" && data !== null) {
    const value = data as Record<string, unknown>;

    if (typeof value.error === "string" && value.error.trim()) {
      return value.error;
    }

    if (typeof value.message === "string" && value.message.trim()) {
      return value.message;
    }
  }

  return fallback;
}

/* =========================================================
   EXTRACT TICKETS
========================================================= */

function extractTickets(data: unknown): Ticket[] | null {
  if (Array.isArray(data)) {
    return data as Ticket[];
  }

  if (typeof data === "object" && data !== null) {
    const value = data as Record<string, unknown>;

    if (Array.isArray(value.tickets)) {
      return value.tickets as Ticket[];
    }

    if (Array.isArray(value.data)) {
      return value.data as Ticket[];
    }
  }

  return null;
}

/* =========================================================
   GET ALL TICKETS
========================================================= */

export async function getTickets(): Promise<Ticket[]> {
  const response = await fetch(API_URL, {
    method: "GET",

    headers: {
      Accept: "application/json",
    },
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(
      getApiError(
        data,
        `Erreur lors de la récupération des billets (${response.status}).`,
      ),
    );
  }

  const tickets = extractTickets(data);

  if (!tickets) {
    console.error("[SiloCamp] Réponse API tickets :", data);

    throw new Error(
      "La réponse du serveur ne contient pas une liste de billets valide.",
    );
  }

  return tickets.map(normalizeTicket);
}

/* =========================================================
   GET TICKET BY ID
========================================================= */

export async function getTicketById(id: string): Promise<Ticket | null> {
  const normalizedId = id.trim();

  if (!normalizedId) {
    return null;
  }

  const tickets = await getTickets();

  return tickets.find((ticket) => ticket.id === normalizedId) ?? null;
}

/* =========================================================
   GET TICKET BY NUMBER
========================================================= */

export async function getTicketByNumber(
  ticketNumber: string,
): Promise<Ticket | null> {
  const normalizedNumber = ticketNumber.trim().toLowerCase();

  if (!normalizedNumber) {
    return null;
  }

  const tickets = await getTickets();

  return (
    tickets.find(
      (ticket) => ticket.ticketNumber.trim().toLowerCase() === normalizedNumber,
    ) ?? null
  );
}

/* =========================================================
   GET BY EMAIL
========================================================= */

export async function getTicketByEmail(email: string): Promise<Ticket[]> {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return [];
  }

  const tickets = await getTickets();

  return tickets.filter(
    (ticket) => normalizeEmail(ticket.email) === normalizedEmail,
  );
}

/* =========================================================
   GET BY PHONE
========================================================= */

export async function getTicketByPhone(phone: string): Promise<Ticket[]> {
  const normalizedPhone = normalizePhone(phone);

  if (!normalizedPhone) {
    return [];
  }

  const tickets = await getTickets();

  return tickets.filter(
    (ticket) => normalizePhone(ticket.phone ?? "") === normalizedPhone,
  );
}

/* =========================================================
   VERIFY TICKET
========================================================= */

export async function verifyTicket(verificationToken: string): Promise<{
  valid: boolean;
  reason?: string | null;
  message: string;
  ticket?: Ticket;
}> {
  const token = verificationToken.trim().toLowerCase();

  if (!token) {
    return {
      valid: false,

      reason: "TOKEN_REQUIRED",

      message: "Token de vérification manquant.",
    };
  }

  if (!/^[a-f0-9]{64}$/.test(token)) {
    return {
      valid: false,

      reason: "INVALID_TOKEN",

      message: "QR Code invalide.",
    };
  }

  try {
    const response = await fetch(`${API_URL}/verify`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        Accept: "application/json",
      },

      body: JSON.stringify({
        token,
      }),
    });

    const data = await parseJson(response);

    if (typeof data !== "object" || data === null) {
      return {
        valid: false,

        reason: "SERVER_ERROR",

        message: `Réponse serveur invalide (${response.status}).`,
      };
    }

    const result = data as {
      valid?: boolean;
      reason?: string | null;
      message?: string;
      ticket?: Ticket;
    };

    return {
      valid: response.ok && result.valid === true,

      reason: result.reason ?? null,

      message: result.message || "Impossible de vérifier le billet.",

      ticket: result.ticket ? normalizeTicket(result.ticket) : undefined,
    };
  } catch (error) {
    console.error("[SiloCamp] Erreur vérification :", error);

    return {
      valid: false,

      reason: "NETWORK_ERROR",

      message: "Impossible de contacter le service de vérification.",
    };
  }
}

/* =========================================================
   CREATE TICKET
========================================================= */

export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  const childrenUnder12 = normalizeQuantity(input.childrenUnder12);

  const children12Plus = normalizeQuantity(input.children12Plus);

  const quantity = calculateConsumedPlaces(children12Plus);

  const participantName =
    input.participantName?.trim() ||
    `${input.firstName ?? ""} ${input.lastName ?? ""}`.trim();

  if (!participantName) {
    throw new Error("Le nom du participant est obligatoire.");
  }

  const email = normalizeEmail(input.email);

  if (!email) {
    throw new Error("L'adresse e-mail est obligatoire.");
  }

  const payload = {
    firstName: input.firstName?.trim() || undefined,

    lastName: input.lastName?.trim() || undefined,

    participantName,

    email,

    phone: input.phone ? normalizePhone(input.phone) : undefined,

    reservationId: input.reservationId?.trim() || undefined,

    eventId: input.eventId?.trim() || undefined,

    eventTitle: input.eventTitle,

    dateLabel: input.dateLabel,

    time: input.time,

    duration: input.duration,

    venue: input.venue,

    city: input.city,

    quantity,

    childrenUnder12,

    children12Plus,
  };

  const response = await fetch(API_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",

      Accept: "application/json",
    },

    body: JSON.stringify(payload),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(
      getApiError(
        data,
        `Erreur lors de la création du billet (${response.status}).`,
      ),
    );
  }

  if (typeof data !== "object" || data === null || !("ticket" in data)) {
    throw new Error("Le serveur n'a pas retourné le billet créé.");
  }

  const ticket = (
    data as {
      ticket?: Ticket;
    }
  ).ticket;

  if (!ticket || !ticket.id || !ticket.ticketNumber) {
    throw new Error("Le serveur n'a pas retourné un billet valide.");
  }

  return normalizeTicket(ticket);
}

/* =========================================================
   GET REAL STATISTICS
========================================================= */

export async function getTicketStats(): Promise<TicketStats> {
  const response = await fetch(`${API_URL}/stats`, {
    method: "GET",

    headers: {
      Accept: "application/json",
    },
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Erreur statistiques (${response.status}).`),
    );
  }

  if (typeof data !== "object" || data === null) {
    throw new Error("Les statistiques retournées sont invalides.");
  }

  const stats = data as Partial<TicketStats>;

  return {
    capacity: Number(stats.capacity ?? 0),

    totalTickets: Number(stats.totalTickets ?? 0),

    validTickets: Number(stats.validTickets ?? 0),

    usedTickets: Number(stats.usedTickets ?? 0),

    cancelledTickets: Number(stats.cancelledTickets ?? 0),

    reserved: Number(stats.reserved ?? 0),

    used: Number(stats.used ?? 0),

    remaining: Number(stats.remaining ?? 0),
  };
}

/* =========================================================
   AVAILABILITY
========================================================= */

export async function checkTicketAvailability(requestedQuantity = 1) {
  const stats = await getTicketStats();

  const quantity = normalizeQuantity(requestedQuantity);

  const available = quantity > 0 && quantity <= stats.remaining;

  return {
    available,

    capacity: stats.capacity,

    reserved: stats.reserved,

    remaining: stats.remaining,

    message: available
      ? undefined
      : `Il ne reste que ${stats.remaining} place(s) disponible(s).`,
  };
}

/* =========================================================
   FAMILY AVAILABILITY
========================================================= */

export async function checkFamilyTicketAvailability(children12Plus = 0) {
  const normalizedChildren = normalizeQuantity(children12Plus);

  const requestedQuantity = calculateConsumedPlaces(normalizedChildren);

  const availability = await checkTicketAvailability(requestedQuantity);

  return {
    ...availability,

    requestedQuantity,
  };
}

/* =========================================================
   REMAINING TICKETS
========================================================= */

export async function getTicketsRemaining(): Promise<number> {
  const stats = await getTicketStats();

  return stats.remaining;
}

/* =========================================================
   VALIDATE TICKET
========================================================= */

export async function validateTicket(ticketNumber: string): Promise<Ticket> {
  const normalizedNumber = ticketNumber.trim().toUpperCase();

  if (!normalizedNumber) {
    throw new Error("Numéro de billet manquant.");
  }

  const response = await fetch(`${API_URL}/validate`, {
    method: "POST",

    credentials: "include",

    headers: {
      "Content-Type": "application/json",

      Accept: "application/json",
    },

    body: JSON.stringify({
      ticketNumber: normalizedNumber,
    }),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Erreur validation (${response.status}).`),
    );
  }

  const ticket = (
    data as {
      ticket?: Ticket;
    }
  ).ticket;

  if (!ticket || !ticket.id || !ticket.ticketNumber) {
    throw new Error("Le serveur n'a pas retourné le billet validé.");
  }

  return normalizeTicket(ticket);
}

/* =========================================================
   ALIASES
========================================================= */

export async function useTicket(ticketNumber: string): Promise<Ticket> {
  return validateTicket(ticketNumber);
}

export async function markTicketAsUsed(ticketNumber: string): Promise<Ticket> {
  return validateTicket(ticketNumber);
}

export async function validateTicketByToken(verificationToken: string) {
  return verifyTicket(verificationToken);
}

/* =========================================================
   CANCEL TICKET
========================================================= */

export async function cancelTicket(ticketNumber: string): Promise<Ticket> {
  const normalizedNumber = ticketNumber.trim().toUpperCase();

  if (!normalizedNumber) {
    throw new Error("Numéro de billet manquant.");
  }

  const response = await fetch(`${API_URL}/cancel`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",

      Accept: "application/json",
    },

    body: JSON.stringify({
      ticketNumber: normalizedNumber,
    }),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(
      getApiError(data, `Impossible d'annuler le billet (${response.status}).`),
    );
  }

  const ticket = (
    data as {
      ticket?: Ticket;
    }
  ).ticket;

  if (!ticket || !ticket.id || !ticket.ticketNumber) {
    throw new Error("Le serveur n'a pas retourné le billet annulé.");
  }

  return normalizeTicket(ticket);
}

/* =========================================================
   SUPPRESSION DÉFINITIVE DU BILLET
========================================================= */

export async function deleteTicket(ticketNumber: string): Promise<void> {
  const normalizedNumber = ticketNumber.trim().toUpperCase();

  if (!normalizedNumber) {
    throw new Error("Numéro de billet manquant.");
  }

  const response = await fetch(
    `${API_URL}/delete?ticketNumber=${encodeURIComponent(normalizedNumber)}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    },
  );

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(
      getApiError(
        data,
        `Impossible de supprimer le billet (${response.status}).`,
      ),
    );
  }
}

/* =========================================================
   RESERVATION ID
========================================================= */

export function generateReservationId(): string {
  const year = new Date().getFullYear();

  const randomPart = crypto
    .randomUUID()
    .replace(/-/g, "")
    .substring(0, 10)
    .toUpperCase();

  return `RES-${year}-${randomPart}`;
}

/* =========================================================
   VERIFICATION URL
========================================================= */

export function getVerificationUrl(ticket: Ticket): string {
  return `${window.location.origin}/ticket/verify?token=${encodeURIComponent(
    ticket.verificationToken ?? "",
  )}`;
}
