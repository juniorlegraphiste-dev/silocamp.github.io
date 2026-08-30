export type TicketStatus = "VALID" | "USED" | "CANCELLED";

export type Ticket = {
  id: string;
  ticketNumber: string;
  verificationToken: string;

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

/* =========================================================
   API URL
   ========================================================= */

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000";

const API_URL = `${API_BASE_URL}/api/tickets`;

/* =========================================================
   TYPES API
   ========================================================= */

export type VerifyTicketResponse = {
  valid: boolean;
  reason?: string | null;
  message: string;
  ticket?: Ticket;
};

/* =========================================================
   RESPONSE PARSER
   ========================================================= */

async function parseResponse<T>(
  response: Response,
): Promise<T> {
  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      `Réponse invalide du serveur (${response.status}).`,
    );
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : `Erreur serveur (${response.status}).`;

    throw new Error(message);
  }

  return data as T;
}

/* =========================================================
   NORMALISATION
   ========================================================= */

function normalizeTicket(ticket: Ticket): Ticket {
  return {
    ...ticket,

    firstName: ticket.firstName ?? null,
    lastName: ticket.lastName ?? null,

    phone: ticket.phone ?? null,

    reservationId: ticket.reservationId ?? null,
    eventId: ticket.eventId ?? null,

    duration: ticket.duration ?? null,

    createdAt: ticket.createdAt,

    usedAt: ticket.usedAt ?? null,
    cancelledAt: ticket.cancelledAt ?? null,
  };
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
    cache: "no-store",
  });

  const tickets = await parseResponse<Ticket[]>(response);

  return tickets.map(normalizeTicket);
}

/* =========================================================
   GET TICKET BY ID
   ========================================================= */

export async function getTicketById(
  id: string,
): Promise<Ticket | null> {
  const tickets = await getTickets();

  return (
    tickets.find((ticket) => ticket.id === id) ??
    null
  );
}

/* =========================================================
   GET TICKET BY NUMBER
   ========================================================= */

export async function getTicketByNumber(
  ticketNumber: string,
): Promise<Ticket | null> {
  const number = ticketNumber.trim();

  if (!number) {
    return null;
  }

  const response = await fetch(
    `${API_URL}/number/${encodeURIComponent(number)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  if (response.status === 404) {
    return null;
  }

  const ticket = await parseResponse<Ticket>(response);

  return normalizeTicket(ticket);
}

/* =========================================================
   GET TICKET BY VERIFICATION TOKEN
   ========================================================= */

export async function getTicketByVerificationToken(
  verificationToken: string,
): Promise<Ticket | null> {
  const token = verificationToken.trim();

  if (!token) {
    return null;
  }

  const result = await verifyTicket(token);

  return result.ticket ?? null;
}

/* =========================================================
   GET TICKETS BY EMAIL
   ========================================================= */

export async function getTicketByEmail(
  email: string,
): Promise<Ticket[]> {
  const normalizedEmail = email
    .trim()
    .toLowerCase();

  if (!normalizedEmail) {
    return [];
  }

  const response = await fetch(
    `${API_URL}/email/${encodeURIComponent(
      normalizedEmail,
    )}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  const tickets =
    await parseResponse<Ticket[]>(response);

  return tickets.map(normalizeTicket);
}

/* =========================================================
   GET TICKETS BY PHONE
   ========================================================= */

export async function getTicketByPhone(
  phone: string,
): Promise<Ticket[]> {
  const normalizedPhone = phone
    .replace(/[^\d+]/g, "")
    .trim();

  if (!normalizedPhone) {
    return [];
  }

  const response = await fetch(
    `${API_URL}/phone/${encodeURIComponent(
      normalizedPhone,
    )}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  const tickets =
    await parseResponse<Ticket[]>(response);

  return tickets.map(normalizeTicket);
}

/* =========================================================
   VERIFY TICKET
   IMPORTANT :
   Cette fonction vérifie uniquement.
   Elle ne marque PAS le billet comme utilisé.
   ========================================================= */

export async function verifyTicket(
  verificationToken: string,
): Promise<VerifyTicketResponse> {
  const token = verificationToken.trim();

  if (!token) {
    return {
      valid: false,
      reason: "TOKEN_REQUIRED",
      message: "Token de vérification manquant.",
    };
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_URL}/verify?token=${encodeURIComponent(
        token,
      )}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );
  } catch {
    throw new Error(
      "Impossible de contacter le serveur SiloCamp.",
    );
  }

  let data: VerifyTicketResponse;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      `Réponse invalide du serveur (${response.status}).`,
    );
  }

  if (data.ticket) {
    data.ticket = normalizeTicket(data.ticket);
  }

  /*
   * IMPORTANT :
   * Le backend peut répondre 400/404 pour un billet utilisé,
   * annulé ou inexistant.
   *
   * On retourne quand même la réponse afin que l'interface
   * puisse afficher correctement le statut.
   */

  return data;
}

/* =========================================================
   CREATE TICKET
   ========================================================= */

export async function createTicket(
  input: CreateTicketInput,
): Promise<Ticket> {
  const participantName =
    input.participantName?.trim() ||
    `${input.firstName ?? ""} ${
      input.lastName ?? ""
    }`.trim();

  const payload = {
    ...input,

    firstName:
      input.firstName?.trim() || undefined,

    lastName:
      input.lastName?.trim() || undefined,

    participantName,

    email: input.email.trim().toLowerCase(),

    phone:
      input.phone?.trim() || undefined,

    reservationId:
      input.reservationId?.trim() || undefined,

    eventId:
      input.eventId?.trim() || undefined,

    eventTitle: input.eventTitle.trim(),

    dateLabel: input.dateLabel.trim(),

    time: input.time.trim(),

    duration:
      input.duration?.trim() || undefined,

    venue: input.venue.trim(),

    city: input.city.trim(),

    quantity: input.quantity ?? 1,
  };

  const response = await fetch(API_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },

    body: JSON.stringify(payload),
  });

  const data = await parseResponse<{
    success: boolean;
    message: string;
    ticket: Ticket;
  }>(response);

  return normalizeTicket(data.ticket);
}

/* =========================================================
   MARK TICKET AS USED
   IMPORTANT :
   C'est cette fonction qui consomme le billet.
   ========================================================= */

export async function markTicketAsUsed(
  ticketNumber: string,
): Promise<Ticket> {
  const number = ticketNumber.trim();

  if (!number) {
    throw new Error(
      "Numéro du billet manquant.",
    );
  }

  const response = await fetch(
    `${API_URL}/${encodeURIComponent(
      number,
    )}/use`,
    {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
  );

  const data = await parseResponse<{
    valid: boolean;
    message: string;
    ticket: Ticket;
  }>(response);

  return normalizeTicket(data.ticket);
}

/* =========================================================
   CANCEL TICKET
   ========================================================= */

export async function cancelTicket(
  ticketNumber: string,
): Promise<Ticket> {
  const number = ticketNumber.trim();

  if (!number) {
    throw new Error(
      "Numéro du billet manquant.",
    );
  }

  const response = await fetch(
    `${API_URL}/${encodeURIComponent(
      number,
    )}/cancel`,
    {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
  );

  const data = await parseResponse<{
    success: boolean;
    message: string;
    ticket: Ticket;
  }>(response);

  return normalizeTicket(data.ticket);
}

/* =========================================================
   STATS
   ========================================================= */

export async function getTicketStats(): Promise<TicketStats> {
  const response = await fetch(
    `${API_URL}/stats`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  return parseResponse<TicketStats>(response);
}

/* =========================================================
   AVAILABILITY
   ========================================================= */

export async function checkTicketAvailability(): Promise<{
  capacity: number;
  reserved: number;
  remaining: number;
}> {
  const stats = await getTicketStats();

  return {
    capacity: stats.capacity,
    reserved: stats.reserved,
    remaining: stats.remaining,
  };
}

export async function getTicketsRemaining(): Promise<number> {
  const stats = await getTicketStats();

  return stats.remaining;
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

export function getVerificationUrl(
  ticket: Ticket,
): string {
  if (typeof window === "undefined") {
    return "";
  }

  return `${window.location.origin}/ticket/verify?token=${encodeURIComponent(
    ticket.verificationToken,
  )}`;
}

/* =========================================================
   COMPATIBILITÉ ANCIEN CODE
   ========================================================= */

export async function validateTicketByToken(
  verificationToken: string,
): Promise<VerifyTicketResponse> {
  return verifyTicket(verificationToken);
}

/*
 * ATTENTION :
 * validateTicket() et useTicket() consomment le billet.
 *
 * Pour simplement afficher/vérifier un QR Code,
 * utiliser verifyTicket() ou validateTicketByToken().
 */

export async function validateTicket(
  ticketNumber: string,
): Promise<Ticket> {
  return markTicketAsUsed(ticketNumber);
}

export async function useTicket(
  ticketNumber: string,
): Promise<Ticket> {
  return markTicketAsUsed(ticketNumber);
}