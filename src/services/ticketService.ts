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

  quantity: number;

  childrenUnder12: number;
  children12Plus: number;

  status: TicketStatus;

  createdAt: string | Date;
  usedAt?: string | Date | null;
  cancelledAt?: string | Date | null;
};

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

export type TicketStats = {
  capacity: number;
  totalTickets: number;
  validTickets: number;
  usedTickets: number;
  cancelledTickets: number;
  reserved: number;
  used: number;
  remaining: number;
};

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || window.location.origin
).replace(/\/$/, "");

const API_URL = `${API_BASE_URL}/api/tickets`;

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string): string {
  return value.replace(/[^\d+]/g, "").trim();
}

function normalizeTicket(ticket: Ticket): Ticket {
  return {
    ...ticket,

    childrenUnder12: Number(ticket.childrenUnder12 ?? 0),
    children12Plus: Number(ticket.children12Plus ?? 0),

    usedAt: ticket.usedAt ?? null,
    cancelledAt: ticket.cancelledAt ?? null,
  };
}

async function parseJson(response: Response): Promise<unknown> {
  const contentType =
    response.headers.get("content-type") || "";

  const text = await response.text();

  if (!text.trim()) {
    return null;
  }

  if (
    !contentType
      .toLowerCase()
      .includes("application/json")
  ) {
    throw new Error(
      `Réponse serveur non JSON (${response.status}) : ${text.slice(
        0,
        300,
      )}`,
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

function getApiError(
  data: unknown,
  fallback: string,
): string {
  if (
    typeof data === "object" &&
    data !== null
  ) {
    const value =
      data as Record<string, unknown>;

    if (
      typeof value.error === "string" &&
      value.error.trim()
    ) {
      return value.error;
    }

    if (
      typeof value.message === "string" &&
      value.message.trim()
    ) {
      return value.message;
    }
  }

  return fallback;
}

function extractTickets(
  data: unknown,
): Ticket[] | null {
  if (Array.isArray(data)) {
    return data as Ticket[];
  }

  if (
    typeof data === "object" &&
    data !== null
  ) {
    const value =
      data as Record<string, unknown>;

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
   RÉCUPÉRER TOUS LES BILLETS
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
    console.error(
      "[SiloCamp] Réponse reçue depuis /api/tickets :",
      data,
    );

    throw new Error(
      "La réponse du serveur ne contient pas une liste de billets valide.",
    );
  }

  return tickets.map(normalizeTicket);
}

/* =========================================================
   BILLET PAR ID
========================================================= */

export async function getTicketById(
  id: string,
): Promise<Ticket | null> {
  const normalizedId = id.trim();

  if (!normalizedId) {
    return null;
  }

  const tickets = await getTickets();

  return (
    tickets.find(
      (ticket) => ticket.id === normalizedId,
    ) ?? null
  );
}

/* =========================================================
   BILLET PAR NUMÉRO
========================================================= */

export async function getTicketByNumber(
  ticketNumber: string,
): Promise<Ticket | null> {
  const normalizedNumber =
    ticketNumber.trim().toLowerCase();

  if (!normalizedNumber) {
    return null;
  }

  const tickets = await getTickets();

  return (
    tickets.find(
      (ticket) =>
        ticket.ticketNumber
          .trim()
          .toLowerCase() === normalizedNumber,
    ) ?? null
  );
}

/* =========================================================
   BILLET PAR EMAIL
========================================================= */

export async function getTicketByEmail(
  email: string,
): Promise<Ticket[]> {
  const normalizedEmail =
    normalizeEmail(email);

  if (!normalizedEmail) {
    return [];
  }

  const tickets = await getTickets();

  return tickets.filter(
    (ticket) =>
      normalizeEmail(ticket.email) ===
      normalizedEmail,
  );
}

/* =========================================================
   BILLET PAR TÉLÉPHONE
========================================================= */

export async function getTicketByPhone(
  phone: string,
): Promise<Ticket[]> {
  const normalizedPhone =
    normalizePhone(phone);

  if (!normalizedPhone) {
    return [];
  }

  const tickets = await getTickets();

  return tickets.filter(
    (ticket) =>
      normalizePhone(ticket.phone ?? "") ===
      normalizedPhone,
  );
}

/* =========================================================
   VÉRIFICATION TOKEN
========================================================= */

export async function verifyTicket(
  verificationToken: string,
): Promise<{
  valid: boolean;
  reason?: string | null;
  message: string;
  ticket?: Ticket;
}> {
  const token =
    verificationToken.trim().toLowerCase();

  if (!token) {
    return {
      valid: false,
      reason: "TOKEN_REQUIRED",
      message:
        "Token de vérification manquant.",
    };
  }

  if (!/^[a-f0-9]{64}$/.test(token)) {
    return {
      valid: false,
      reason: "INVALID_TOKEN",
      message: "QR Code invalide.",
    };
  }

  const response = await fetch(
    `${API_URL}/verify`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ token }),
    },
  );

  const data = await parseJson(response);

  if (
    typeof data !== "object" ||
    data === null
  ) {
    return {
      valid: false,
      reason: "SERVER_ERROR",
      message: `Réponse serveur invalide (${response.status}).`,
    };
  }

  const result = data as {
    ok?: boolean;
    valid?: boolean;
    reason?: string | null;
    message?: string;
    ticket?: Ticket;
  };

  return {
    valid: result.valid === true,

    reason: result.reason ?? null,

    message:
      result.message ||
      (response.ok
        ? "Billet valide."
        : "Impossible de vérifier le billet."),

    ticket: result.ticket
      ? normalizeTicket(result.ticket)
      : undefined,
  };
}

/* =========================================================
   CRÉATION BILLET
========================================================= */

export async function createTicket(
  input: CreateTicketInput,
): Promise<Ticket> {
  const childrenUnder12 = Math.max(
    0,
    Math.floor(
      Number(input.childrenUnder12 ?? 0),
    ),
  );

  const children12Plus = Math.max(
    0,
    Math.floor(
      Number(input.children12Plus ?? 0),
    ),
  );

  const payload = {
    ...input,

    email: normalizeEmail(input.email),

    phone: input.phone
      ? normalizePhone(input.phone)
      : undefined,

    participantName:
      input.participantName?.trim() ||
      `${input.firstName ?? ""} ${
        input.lastName ?? ""
      }`.trim(),

    quantity: input.quantity ?? 1,

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

  if (
    typeof data !== "object" ||
    data === null ||
    !("ticket" in data)
  ) {
    console.error(
      "[SiloCamp] Réponse création billet :",
      data,
    );

    throw new Error(
      "Le serveur n'a pas retourné le billet créé.",
    );
  }

  const ticket = (
    data as {
      ticket?: Ticket;
    }
  ).ticket;

  if (
    !ticket ||
    typeof ticket !== "object" ||
    !ticket.id ||
    !ticket.ticketNumber
  ) {
    console.error(
      "[SiloCamp] Billet retourné invalide :",
      ticket,
    );

    throw new Error(
      "Le serveur n'a pas retourné un billet valide.",
    );
  }

  return normalizeTicket(ticket);
}

/* =========================================================
   STATISTIQUES
========================================================= */

export async function getTicketStats(): Promise<TicketStats> {
  const response = await fetch(
    `${API_URL}/stats`,
    {
      method: "GET",
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
        `Erreur lors de la récupération des statistiques (${response.status}).`,
      ),
    );
  }

  if (
    typeof data !== "object" ||
    data === null
  ) {
    throw new Error(
      "Les statistiques retournées par le serveur sont invalides.",
    );
  }

  const stats =
    data as Partial<TicketStats>;

  if (
    typeof stats.capacity !== "number" ||
    typeof stats.reserved !== "number" ||
    typeof stats.remaining !== "number"
  ) {
    throw new Error(
      "Les statistiques retournées par le serveur sont invalides.",
    );
  }

  return data as TicketStats;
}

/* =========================================================
   DISPONIBILITÉ
========================================================= */

export async function checkTicketAvailability(
  requestedQuantity = 1,
): Promise<{
  available: boolean;
  capacity: number;
  reserved: number;
  remaining: number;
  message?: string;
}> {
  const stats = await getTicketStats();

  const available =
    requestedQuantity > 0 &&
    requestedQuantity <= stats.remaining;

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
   PLACES RESTANTES
========================================================= */

export async function getTicketsRemaining(): Promise<number> {
  const stats = await getTicketStats();

  return stats.remaining;
}

/* =========================================================
   ID RÉSERVATION
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
   URL VÉRIFICATION
========================================================= */

export function getVerificationUrl(
  ticket: Ticket,
): string {
  return `${
    window.location.origin
  }/ticket/verify?token=${encodeURIComponent(
    ticket.verificationToken ?? "",
  )}`;
}

/* =========================================================
   ALIAS
========================================================= */

export async function validateTicketByToken(
  verificationToken: string,
) {
  return verifyTicket(verificationToken);
}

/* =========================================================
   VALIDATION PHYSIQUE
========================================================= */

export async function validateTicket(
  ticketNumber: string,
): Promise<Ticket> {
  const normalizedNumber =
    ticketNumber.trim().toUpperCase();

  if (!normalizedNumber) {
    throw new Error(
      "Numéro de billet manquant.",
    );
  }

  const response = await fetch(
    `${API_URL}/validate`,
    {
      method: "POST",
      credentials: "include",

      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },

      body: JSON.stringify({
        ticketNumber: normalizedNumber,
      }),
    },
  );

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(
      getApiError(
        data,
        `Erreur lors de la validation du billet (${response.status}).`,
      ),
    );
  }

  if (
    typeof data !== "object" ||
    data === null ||
    !("ticket" in data)
  ) {
    throw new Error(
      "Le serveur n'a pas retourné le billet validé.",
    );
  }

  const ticket = (
    data as {
      ticket?: Ticket;
    }
  ).ticket;

  if (
    !ticket ||
    typeof ticket !== "object" ||
    !ticket.id ||
    !ticket.ticketNumber
  ) {
    throw new Error(
      "Le serveur a retourné un billet invalide.",
    );
  }

  return normalizeTicket(ticket);
}

/* =========================================================
   UTILISATION DU BILLET
========================================================= */

export async function useTicket(
  ticketNumber: string,
): Promise<Ticket> {
  return validateTicket(ticketNumber);
}

/* =========================================================
   MARQUER BILLET COMME UTILISÉ
========================================================= */

export async function markTicketAsUsed(
  ticketNumber: string,
): Promise<Ticket> {
  return validateTicket(ticketNumber);
}

/* =========================================================
   ANNULATION
========================================================= */

export async function cancelTicket(
  ticketNumber: string,
): Promise<Ticket> {
  const normalizedNumber =
    ticketNumber.trim().toUpperCase();

  if (!normalizedNumber) {
    throw new Error(
      "Numéro de billet manquant.",
    );
  }

  const response = await fetch(
    `${API_URL}/cancel`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },

      body: JSON.stringify({
        ticketNumber: normalizedNumber,
      }),
    },
  );

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(
      getApiError(
        data,
        `Impossible d'annuler le billet (${response.status}).`,
      ),
    );
  }

  if (
    typeof data !== "object" ||
    data === null
  ) {
    throw new Error(
      "La réponse d'annulation du billet est invalide.",
    );
  }

  const ticket = (
    data as {
      ticket?: Ticket;
    }
  ).ticket;

  if (
    !ticket ||
    typeof ticket !== "object" ||
    !ticket.id ||
    !ticket.ticketNumber
  ) {
    throw new Error(
      "Le serveur n'a pas retourné le billet annulé.",
    );
  }

  return normalizeTicket(ticket);
}