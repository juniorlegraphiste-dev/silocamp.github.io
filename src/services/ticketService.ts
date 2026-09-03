export type TicketStatus = "VALID" | "USED" | "CANCELLED";

export interface Ticket {
  id: string;
  ticketNumber: string;
  verificationToken?: string;
  firstName?: string;
  lastName?: string;
  participantName: string;
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
  quantity: number;
  status: TicketStatus;
  createdAt: string;
  usedAt?: string | null;
  cancelledAt?: string | null;
}

export interface CreateTicketInput {
  firstName?: string;
  lastName?: string;
  participantName: string;
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
  quantity: number;
}

export interface TicketStats {
  capacity: number;
  totalTickets: number;
  validTickets: number;
  usedTickets: number;
  cancelledTickets: number;
  reserved: number;
  used: number;
  remaining: number;
}

interface ApiResponse<T = unknown> {
  ok: boolean;
  error?: string;
  message?: string;
  ticket?: T;
  tickets?: T[];
}

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" ? window.location.origin : "")
).replace(/\/+$/, "");

const API_URL = `${API_BASE_URL}/api/tickets`;

function getErrorMessage(data: ApiResponse, fallback: string): string {
  return data.error || data.message || fallback;
}

async function parseResponse<T>(
  response: Response,
  fallback: string
): Promise<T> {
  let data: ApiResponse<T>;

  try {
    data = await response.json();
  } catch {
    throw new Error(fallback);
  }

  if (!response.ok || data.ok === false) {
    throw new Error(getErrorMessage(data, fallback));
  }

  return data as T;
}

function normalizeTicket(ticket: any): Ticket {
  return {
    id: String(ticket.id),
    ticketNumber: String(ticket.ticketNumber),
    verificationToken:
      ticket.verificationToken === undefined
        ? undefined
        : String(ticket.verificationToken),
    firstName: ticket.firstName || undefined,
    lastName: ticket.lastName || undefined,
    participantName: String(ticket.participantName || ""),
    email: String(ticket.email || ""),
    phone: ticket.phone || undefined,
    reservationId: ticket.reservationId || undefined,
    eventId: ticket.eventId || undefined,
    eventTitle: String(ticket.eventTitle || ""),
    dateLabel: String(ticket.dateLabel || ""),
    time: String(ticket.time || ""),
    duration: ticket.duration || undefined,
    venue: String(ticket.venue || ""),
    city: String(ticket.city || ""),
    quantity: Number(ticket.quantity || 1),
    status: ticket.status as TicketStatus,
    createdAt: String(ticket.createdAt || ""),
    usedAt: ticket.usedAt ?? null,
    cancelledAt: ticket.cancelledAt ?? null,
  };
}

function validateVerificationTokenFormat(token: string): string {
  const normalizedToken = String(token || "").trim().toLowerCase();

  if (!/^[a-f0-9]{64}$/.test(normalizedToken)) {
    throw new Error("Token de vérification invalide.");
  }

  return normalizedToken;
}

function normalizeEmail(email: string): string {
  return String(email || "").trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  return String(phone || "").replace(/\s+/g, "").trim();
}

export async function getTickets(): Promise<Ticket[]> {
  const response = await fetch(API_URL, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await parseResponse<ApiResponse>(
    response,
    "Impossible de récupérer les tickets."
  );

  return (data.tickets || []).map(normalizeTicket);
}

export async function getTicketById(
  id: string
): Promise<Ticket | null> {
  const tickets = await getTickets();

  return tickets.find((ticket) => ticket.id === id) || null;
}

export async function getTicketByNumber(
  ticketNumber: string
): Promise<Ticket | null> {
  const normalized = String(ticketNumber || "").trim().toUpperCase();

  if (!normalized) {
    return null;
  }

  const tickets = await getTickets();

  return (
    tickets.find(
      (ticket) =>
        ticket.ticketNumber.trim().toUpperCase() === normalized
    ) || null
  );
}

export async function getTicketByReservationId(
  reservationId: string
): Promise<Ticket | null> {
  const normalized = String(reservationId || "").trim();

  if (!normalized) {
    return null;
  }

  const tickets = await getTickets();

  return (
    tickets.find(
      (ticket) => ticket.reservationId === normalized
    ) || null
  );
}

export async function getTicketByEmail(
  email: string
): Promise<Ticket | null> {
  const normalized = normalizeEmail(email);

  if (!normalized) {
    return null;
  }

  const tickets = await getTickets();

  return (
    tickets.find(
      (ticket) => normalizeEmail(ticket.email) === normalized
    ) || null
  );
}

export async function getTicketByPhone(
  phone: string
): Promise<Ticket | null> {
  const normalized = normalizePhone(phone);

  if (!normalized) {
    return null;
  }

  const tickets = await getTickets();

  return (
    tickets.find(
      (ticket) => normalizePhone(ticket.phone || "") === normalized
    ) || null
  );
}

export async function createTicket(
  input: CreateTicketInput
): Promise<Ticket> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      ...input,
      email: normalizeEmail(input.email),
      phone: normalizePhone(input.phone || ""),
      quantity: 1,
    }),
  });

  const data = await parseResponse<ApiResponse>(
    response,
    "Impossible de créer le ticket."
  );

  if (!data.ticket) {
    throw new Error("Le serveur n'a pas retourné le ticket créé.");
  }

  return normalizeTicket(data.ticket);
}

export async function verifyTicket(
  token: string
): Promise<Ticket> {
  const normalizedToken = validateVerificationTokenFormat(token);

  const response = await fetch(`${API_URL}/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      token: normalizedToken,
    }),
  });

  const data = await parseResponse<ApiResponse>(
    response,
    "Impossible de vérifier le ticket."
  );

  if (!data.ticket) {
    throw new Error("Ticket introuvable.");
  }

  return normalizeTicket(data.ticket);
}

export async function validateTicket(
  ticketNumber: string
): Promise<Ticket> {
  const normalizedTicketNumber = String(ticketNumber || "")
    .trim()
    .toUpperCase();

  if (!normalizedTicketNumber) {
    throw new Error("Numéro de ticket invalide.");
  }

  const response = await fetch(`${API_URL}/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      ticketNumber: normalizedTicketNumber,
    }),
  });

  const data = await parseResponse<ApiResponse>(
    response,
    "Impossible de valider le ticket."
  );

  if (!data.ticket) {
    throw new Error("Le serveur n'a pas retourné le ticket validé.");
  }

  return normalizeTicket(data.ticket);
}

export async function useTicket(
  ticketNumber: string
): Promise<Ticket> {
  return validateTicket(ticketNumber);
}

export async function markTicketAsUsed(
  ticketNumber: string
): Promise<Ticket> {
  return validateTicket(ticketNumber);
}

export async function cancelTicket(
  ticketNumber: string
): Promise<Ticket> {
  const normalizedTicketNumber = String(ticketNumber || "")
    .trim()
    .toUpperCase();

  if (!normalizedTicketNumber) {
    throw new Error("Numéro de ticket invalide.");
  }

  const response = await fetch(`${API_URL}/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      ticketNumber: normalizedTicketNumber,
    }),
  });

  const data = await parseResponse<ApiResponse>(
    response,
    "Impossible d'annuler le ticket."
  );

  if (!data.ticket) {
    throw new Error("Le serveur n'a pas retourné le ticket annulé.");
  }

  return normalizeTicket(data.ticket);
}

export async function getTicketStats(): Promise<TicketStats> {
  const response = await fetch(`${API_URL}/stats`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await parseResponse<ApiResponse<TicketStats>>(
    response,
    "Impossible de récupérer les statistiques."
  );

  return {
    capacity: Number((data as any).capacity || 1200),
    totalTickets: Number((data as any).totalTickets || 0),
    validTickets: Number((data as any).validTickets || 0),
    usedTickets: Number((data as any).usedTickets || 0),
    cancelledTickets: Number((data as any).cancelledTickets || 0),
    reserved: Number((data as any).reserved || 0),
    used: Number((data as any).used || 0),
    remaining: Number((data as any).remaining || 0),
  };
}

export async function checkTicketAvailability(
  quantity = 1
): Promise<boolean> {
  if (quantity !== 1) {
    return false;
  }

  const stats = await getTicketStats();

  return stats.remaining >= 1;
}

export async function getTicketsRemaining(): Promise<number> {
  const stats = await getTicketStats();

  return stats.remaining;
}

export function generateReservationId(): string {
  const year = new Date().getFullYear();
  const random = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();

  return `CIS-${random}-${year}`;
}

export function getVerificationUrl(
  verificationToken: string
): string {
  const token = validateVerificationTokenFormat(verificationToken);

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : API_BASE_URL;

  return `${baseUrl}/verify-ticket?token=${encodeURIComponent(token)}`;
}

export async function validateTicketByToken(
  token: string
): Promise<Ticket> {
  return verifyTicket(token);
}