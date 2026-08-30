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

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000";

const API_URL = `${API_BASE_URL}/api/tickets`;

async function parseResponse<T>(response: Response): Promise<T> {
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

function normalizeTicket(ticket: Ticket): Ticket {
  return {
    ...ticket,
    createdAt: ticket.createdAt,
    usedAt: ticket.usedAt ?? null,
    cancelledAt: ticket.cancelledAt ?? null,
  };
}

export async function getTickets(): Promise<Ticket[]> {
  const response = await fetch(API_URL);

  const tickets = await parseResponse<Ticket[]>(response);

  return tickets.map(normalizeTicket);
}

export async function getTicketById(
  id: string,
): Promise<Ticket | null> {
  const tickets = await getTickets();

  return tickets.find((ticket) => ticket.id === id) ?? null;
}

export async function getTicketByNumber(
  ticketNumber: string,
): Promise<Ticket | null> {
  const response = await fetch(
    `${API_URL}/number/${encodeURIComponent(ticketNumber)}`,
  );

  if (response.status === 404) {
    return null;
  }

  const ticket = await parseResponse<Ticket>(response);

  return normalizeTicket(ticket);
}

export async function getTicketByEmail(
  email: string,
): Promise<Ticket[]> {
  const response = await fetch(
    `${API_URL}/email/${encodeURIComponent(email.trim().toLowerCase())}`,
  );

  const tickets = await parseResponse<Ticket[]>(response);

  return tickets.map(normalizeTicket);
}

export async function getTicketByPhone(
  phone: string,
): Promise<Ticket[]> {
  const normalizedPhone = phone
    .replace(/[^\d+]/g, "")
    .trim();

  const response = await fetch(
    `${API_URL}/phone/${encodeURIComponent(normalizedPhone)}`,
  );

  const tickets = await parseResponse<Ticket[]>(response);

  return tickets.map(normalizeTicket);
}

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

  const response = await fetch(
    `${API_URL}/verify?token=${encodeURIComponent(token)}`,
  );

  let data: {
    valid: boolean;
    reason?: string | null;
    message: string;
    ticket?: Ticket;
  };

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

  return data;
}

export async function createTicket(
  input: CreateTicketInput,
): Promise<Ticket> {
  const payload = {
    ...input,
    email: input.email.trim().toLowerCase(),
    phone: input.phone?.trim() || undefined,
    participantName:
      input.participantName?.trim() ||
      `${input.firstName ?? ""} ${input.lastName ?? ""}`.trim(),
    quantity: input.quantity ?? 1,
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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

export async function markTicketAsUsed(
  ticketNumber: string,
): Promise<Ticket> {
  const response = await fetch(
    `${API_URL}/${encodeURIComponent(ticketNumber)}/use`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
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

export async function cancelTicket(
  ticketNumber: string,
): Promise<Ticket> {
  const response = await fetch(
    `${API_URL}/${encodeURIComponent(ticketNumber)}/cancel`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
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

export async function getTicketStats(): Promise<TicketStats> {
  const response = await fetch(`${API_URL}/stats`);

  return parseResponse<TicketStats>(response);
}

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

export function generateReservationId(): string {
  const year = new Date().getFullYear();

  const randomPart = crypto
    .randomUUID()
    .replace(/-/g, "")
    .substring(0, 10)
    .toUpperCase();

  return `RES-${year}-${randomPart}`;
}

export function getVerificationUrl(
  ticket: Ticket,
): string {
  return `${window.location.origin}/ticket/verify?token=${encodeURIComponent(
    ticket.verificationToken,
  )}`;
}