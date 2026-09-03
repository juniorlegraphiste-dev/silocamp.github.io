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

type TicketsResponse = {
  ok: boolean;
  tickets: Ticket[];
};

type TicketResponse = {
  ok: boolean;
  ticket: Ticket;
};

type ErrorResponse = {
  ok?: boolean;
  success?: boolean;
  message?: string;
  error?: string;
};

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || window.location.origin
).replace(/\/$/, "");

const API_URL = `${API_BASE_URL}/api/tickets`;

async function parseResponse<T>(response: Response): Promise<T> {
  const rawText = await response.text();

  let data: unknown = null;

  if (rawText.trim()) {
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error(
        `Le serveur a renvoyé un JSON invalide (${response.status}).`,
      );
    }
  }

  if (!response.ok) {
    const errorData = data as ErrorResponse | null;

    const message =
      errorData?.error ||
      errorData?.message ||
      `Erreur serveur (${response.status}).`;

    throw new Error(message);
  }

  return data as T;
}

function normalizeTicket(ticket: Ticket): Ticket {
  return {
    ...ticket,
    usedAt: ticket.usedAt ?? null,
    cancelledAt: ticket.cancelledAt ?? null,
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "").trim();
}

/* =========================================================
   GET ALL
========================================================= */

export async function getTickets(): Promise<Ticket[]> {
  const response = await fetch(API_URL, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const data = await parseResponse<TicketsResponse>(response);

  if (!data?.ok || !Array.isArray(data.tickets)) {
    throw new Error(
      "La réponse du serveur ne contient pas une liste de billets valide.",
    );
  }

  return data.tickets.map(normalizeTicket);
}

/* =========================================================
   GET BY ID
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
   GET BY NUMBER
========================================================= */

export async function getTicketByNumber(
  ticketNumber: string,
): Promise<Ticket | null> {
  const normalizedNumber = ticketNumber.trim();

  if (!normalizedNumber) {
    return null;
  }

  const tickets = await getTickets();

  return (
    tickets.find(
      (ticket) =>
        ticket.ticketNumber.trim().toUpperCase() ===
        normalizedNumber.toUpperCase(),
    ) ?? null
  );
}

/* =========================================================
   GET BY EMAIL
========================================================= */

export async function getTicketByEmail(
  email: string,
): Promise<Ticket[]> {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return [];
  }

  const tickets = await getTickets();

  return tickets.filter(
    (ticket) =>
      normalizeEmail(ticket.email) === normalizedEmail,
  );
}

/* =========================================================
   GET BY PHONE
========================================================= */

export async function getTicketByPhone(
  phone: string,
): Promise<Ticket[]> {
  const normalizedPhone = normalizePhone(phone);

  if (!normalizedPhone) {
    return [];
  }

  const tickets = await getTickets();

  return tickets.filter(
    (ticket) =>
      ticket.phone &&
      normalizePhone(ticket.phone) === normalizedPhone,
  );
}

/* =========================================================
   VERIFY TOKEN
========================================================= */

export async function verifyTicket(
  verificationToken: string,
): Promise<{
  valid: boolean;
  reason?: string | null;
  message: string;
  ticket?: Ticket;
}> {
  const token = verificationToken.trim();

  if (!token) {
    return {
      valid: false,
      reason: "TOKEN_REQUIRED",
      message: "Token de vérification manquant.",
    };
  }

  const tickets = await getTickets();

  const ticket =
    tickets.find(
      (item) =>
        item.verificationToken === token,
    ) ?? null;

  if (!ticket) {
    return {
      valid: false,
      reason: "TICKET_NOT_FOUND",
      message: "Billet introuvable.",
    };
  }

  if (ticket.status === "CANCELLED") {
    return {
      valid: false,
      reason: "TICKET_CANCELLED",
      message: "Ce billet a été annulé.",
      ticket,
    };
  }

  if (ticket.status === "USED") {
    return {
      valid: false,
      reason: "TICKET_USED",
      message: "Ce billet a déjà été utilisé.",
      ticket,
    };
  }

  return {
    valid: true,
    reason: null,
    message: "Billet valide.",
    ticket,
  };
}

/* =========================================================
   CREATE
========================================================= */

export async function createTicket(
  input: CreateTicketInput,
): Promise<Ticket> {
  const payload = {
    ...input,
    email: normalizeEmail(input.email),
    phone: input.phone
      ? normalizePhone(input.phone)
      : undefined,
    participantName:
      input.participantName?.trim() ||
      `${input.firstName ?? ""} ${input.lastName ?? ""}`.trim(),
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

  const data =
    await parseResponse<TicketResponse>(response);

  if (!data?.ok || !data.ticket) {
    throw new Error(
      "Le serveur n'a pas retourné le billet créé.",
    );
  }

  return normalizeTicket(data.ticket);
}

/* =========================================================
   STATS
========================================================= */

export async function getTicketStats(): Promise<TicketStats> {
  const response = await fetch(`${API_URL}/stats`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

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
  return (
    `${window.location.origin}/ticket/verify?token=` +
    encodeURIComponent(ticket.verificationToken)
  );
}

/* =========================================================
   COMPATIBILITY
========================================================= */

export async function validateTicketByToken(
  verificationToken: string,
) {
  return verifyTicket(verificationToken);
}

export async function validateTicket(
  ticketNumber: string,
): Promise<Ticket> {
  const ticket = await getTicketByNumber(ticketNumber);

  if (!ticket) {
    throw new Error("Billet introuvable.");
  }

  if (ticket.status !== "VALID") {
    throw new Error(
      ticket.status === "USED"
        ? "Ce billet a déjà été utilisé."
        : "Ce billet est annulé.",
    );
  }

  return ticket;
}

export async function useTicket(
  ticketNumber: string,
): Promise<Ticket> {
  return validateTicket(ticketNumber);
}

export async function markTicketAsUsed(
  ticketNumber: string,
): Promise<Ticket> {
  return validateTicket(ticketNumber);
}

export async function cancelTicket(
  ticketNumber: string,
): Promise<Ticket> {
  throw new Error(
    "L'annulation des billets nécessite encore l'endpoint API /cancel.",
  );
}