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

export type TicketVerificationResult = {
  valid: boolean;
  reason?: string | null;
  message: string;
  ticket?: Ticket;
};

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000";

const API_URL = `${API_BASE_URL}/api/tickets`;

async function parseResponse<T>(response: Response): Promise<T> {
  let data: unknown = null;

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

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "").trim();
}

export async function getTickets(): Promise<Ticket[]> {
  const response = await fetch(API_URL);

  const tickets = await parseResponse<Ticket[]>(response);

  return tickets.map(normalizeTicket);
}

export async function getTicketById(
  id: string,
): Promise<Ticket | null> {
  if (!id.trim()) {
    return null;
  }

  const response = await fetch(
    `${API_URL}/${encodeURIComponent(id.trim())}`,
  );

  if (response.status === 404) {
    return null;
  }

  const ticket = await parseResponse<Ticket>(response);

  return normalizeTicket(ticket);
}

export async function getTicketByNumber(
  ticketNumber: string,
): Promise<Ticket | null> {
  const value = ticketNumber.trim();

  if (!value) {
    return null;
  }

  const response = await fetch(
    `${API_URL}/number/${encodeURIComponent(value)}`,
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
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return [];
  }

  const response = await fetch(
    `${API_URL}/email/${encodeURIComponent(normalizedEmail)}`,
  );

  if (response.status === 404) {
    return [];
  }

  const tickets = await parseResponse<Ticket[]>(response);

  return tickets.map(normalizeTicket);
}

export async function getTicketByPhone(
  phone: string,
): Promise<Ticket[]> {
  const normalizedPhone = normalizePhone(phone);

  if (!normalizedPhone) {
    return [];
  }

  const response = await fetch(
    `${API_URL}/phone/${encodeURIComponent(normalizedPhone)}`,
  );

  if (response.status === 404) {
    return [];
  }

  const tickets = await parseResponse<Ticket[]>(response);

  return tickets.map(normalizeTicket);
}

export async function verifyTicket(
  verificationToken: string,
): Promise<TicketVerificationResult> {
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

  const data = await parseResponse<TicketVerificationResult>(
    response,
  );

  return {
    ...data,
    ticket: data.ticket
      ? normalizeTicket(data.ticket)
      : undefined,
  };
}

export async function validateTicketByToken(
  verificationToken: string,
): Promise<TicketVerificationResult> {
  return verifyTicket(verificationToken);
}

export async function createTicket(
  input: CreateTicketInput,
): Promise<Ticket> {
  const email = normalizeEmail(input.email);

  const phone = input.phone
    ? normalizePhone(input.phone)
    : undefined;

  const participantName =
    input.participantName?.trim() ||
    `${input.firstName ?? ""} ${input.lastName ?? ""}`.trim();

  if (!email) {
    throw new Error("L'adresse e-mail est requise.");
  }

  if (!participantName) {
    throw new Error("Le nom du participant est requis.");
  }

  if (!input.eventTitle?.trim()) {
    throw new Error("Le nom de l'événement est requis.");
  }

  const quantity = input.quantity ?? 1;

  if (quantity !== 1) {
    throw new Error(
      "Une seule place peut être réservée par participant.",
    );
  }

  const payload: CreateTicketInput = {
    ...input,
    firstName: input.firstName?.trim() || undefined,
    lastName: input.lastName?.trim() || undefined,
    participantName,
    email,
    phone,
    reservationId: input.reservationId?.trim() || undefined,
    eventId: input.eventId?.trim() || undefined,
    eventTitle: input.eventTitle.trim(),
    dateLabel: input.dateLabel.trim(),
    time: input.time.trim(),
    duration: input.duration?.trim() || undefined,
    venue: input.venue.trim(),
    city: input.city.trim(),
    quantity,
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

  if (!data.ticket) {
    throw new Error(
      data.message || "Le billet n'a pas pu être créé.",
    );
  }

  return normalizeTicket(data.ticket);
}

export async function markTicketAsUsed(
  ticketNumber: string,
): Promise<Ticket> {
  const value = ticketNumber.trim();

  if (!value) {
    throw new Error("Numéro de billet manquant.");
  }

  const response = await fetch(
    `${API_URL}/${encodeURIComponent(value)}/use`,
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

  if (!data.ticket) {
    throw new Error(
      data.message || "Le billet n'a pas pu être utilisé.",
    );
  }

  return normalizeTicket(data.ticket);
}

export async function cancelTicket(
  ticketNumber: string,
): Promise<Ticket> {
  const value = ticketNumber.trim();

  if (!value) {
    throw new Error("Numéro de billet manquant.");
  }

  const response = await fetch(
    `${API_URL}/${encodeURIComponent(value)}/cancel`,
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

  if (!data.ticket) {
    throw new Error(
      data.message || "Le billet n'a pas pu être annulé.",
    );
  }

  return normalizeTicket(data.ticket);
}

export async function getTicketStats(): Promise<TicketStats> {
  const response = await fetch(`${API_URL}/stats`);

  return parseResponse<TicketStats>(response);
}

export async function checkTicketAvailability(
  quantity = 1,
): Promise<{
  available: boolean;
  capacity: number;
  reserved: number;
  remaining: number;
  requested: number;
  message?: string;
}> {
  const stats = await getTicketStats();

  const requested = Math.max(1, quantity);
  const available = stats.remaining >= requested;

  return {
    available,
    capacity: stats.capacity,
    reserved: stats.reserved,
    remaining: stats.remaining,
    requested,
    message: available
      ? undefined
      : `Il ne reste que ${stats.remaining} place${
          stats.remaining > 1 ? "s" : ""
        } disponible${
          stats.remaining > 1 ? "s" : ""
        }.`,
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
  if (typeof window === "undefined") {
    return `/ticket/verify?token=${encodeURIComponent(
      ticket.verificationToken,
    )}`;
  }

  return `${window.location.origin}/ticket/verify?token=${encodeURIComponent(
    ticket.verificationToken,
  )}`;
}

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