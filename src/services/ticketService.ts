/**
 * =========================================================
 * SILOCAMP — TICKET SERVICE
 * =========================================================
 *
 * Frontend Vite / React
 * Backend Express / Prisma / Neon
 *
 * Local :
 *   http://localhost:4000/api
 *
 * Production :
 *   https://silocamp-github-io.vercel.app/api
 *
 * Si VITE_API_URL est défini, il est prioritaire.
 * =========================================================
 */

export type TicketStatus =
  | "VALID"
  | "USED"
  | "CANCELLED";

export type Ticket = {
  id: string;

  ticketNumber: string;
  verificationToken: string;

  firstName: string | null;
  lastName: string | null;
  participantName: string;

  email: string;
  phone: string | null;

  reservationId: string | null;

  eventId: string | null;
  eventTitle: string;
  dateLabel: string;
  time: string;
  duration: string | null;
  venue: string;
  city: string;

  quantity: number;

  status: TicketStatus;

  createdAt: string;
  usedAt: string | null;
  cancelledAt: string | null;
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

export type CreateTicketResponse = {
  success: boolean;
  message: string;
  ticket: Ticket;
};

export type TicketVerificationResponse = {
  valid: boolean;

  reason:
    | null
    | "TOKEN_REQUIRED"
    | "NOT_FOUND"
    | "CANCELLED"
    | "USED";

  message: string;

  ticket?: Ticket;
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

export type ApiErrorResponse = {
  message?: string;
  valid?: boolean;
  reason?: string;
  ticket?: Ticket;
  capacity?: number;
  reserved?: number;
  remaining?: number;
};

/**
 * =========================================================
 * CONFIGURATION API
 * =========================================================
 */

const LOCAL_API_URL = "http://localhost:4000/api";

/**
 * En production Vercel :
 *
 * /api
 *
 * En local :
 *
 * http://localhost:4000/api
 */
const API_BASE_URL =
  import.meta.env.VITE_API_URL?.trim() ||
  (import.meta.env.PROD
    ? "/api"
    : LOCAL_API_URL);

/**
 * Nettoyage de l'URL.
 */
const API_URL = API_BASE_URL.replace(/\/+$/, "");

/**
 * =========================================================
 * HELPERS
 * =========================================================
 */

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone?: string): string | undefined {
  if (!phone) {
    return undefined;
  }

  const normalized = phone
    .replace(/[^\d+]/g, "")
    .trim();

  return normalized || undefined;
}

/**
 * Génère un identifiant de réservation.
 *
 * Exemple :
 * SILO-RES-2026-A8F3K2P9
 */
export function generateReservationId(): string {
  const year = new Date().getFullYear();

  const randomPart = crypto
    .randomUUID()
    .replace(/-/g, "")
    .substring(0, 8)
    .toUpperCase();

  return `SILO-RES-${year}-${randomPart}`;
}

/**
 * =========================================================
 * API REQUEST
 * =========================================================
 */

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,

      headers: {
        Accept: "application/json",

        ...(options.body
          ? {
              "Content-Type":
                "application/json",
            }
          : {}),

        ...(options.headers || {}),
      },

      credentials: "include",
    });
  } catch (error) {
    console.error(
      "[SiloCamp API] Erreur réseau :",
      error,
    );

    throw new Error(
      "Impossible de contacter le serveur SiloCamp.",
    );
  }

  let data: unknown = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const apiError =
      data as ApiErrorResponse | null;

    throw new Error(
      apiError?.message ||
        `Erreur API (${response.status}).`,
    );
  }

  return data as T;
}

/**
 * =========================================================
 * CHECK API
 * =========================================================
 */

export async function checkApiHealth(): Promise<{
  success: boolean;
  service: string;
  status: string;
  timestamp?: string;
}> {
  return apiRequest("/health");
}

/**
 * =========================================================
 * GET ALL TICKETS
 * =========================================================
 */

export async function getTickets(): Promise<Ticket[]> {
  return apiRequest<Ticket[]>("/");
}

/**
 * =========================================================
 * GET STATISTICS
 * =========================================================
 */

export async function getTicketStats(): Promise<TicketStats> {
  return apiRequest<TicketStats>("/tickets/stats");
}

/**
 * =========================================================
 * CHECK TICKET AVAILABILITY
 * =========================================================
 *
 * Le backend calcule :
 *
 * capacity = 1200
 * reserved = nombre de places VALID
 * remaining = capacity - reserved
 *
 * Exemple :
 *
 * {
 *   available: true,
 *   remaining: 1189
 * }
 */

export async function checkTicketAvailability(
  requestedQuantity = 1,
): Promise<{
  available: boolean;
  capacity: number;
  reserved: number;
  remaining: number;
  requested: number;
  message?: string;
}> {
  if (
    !Number.isInteger(requestedQuantity) ||
    requestedQuantity <= 0
  ) {
    return {
      available: false,
      capacity: 1200,
      reserved: 0,
      remaining: 0,
      requested: requestedQuantity,
      message:
        "La quantité demandée est invalide.",
    };
  }

  try {
    const stats =
      await getTicketStats();

    const available =
      stats.remaining >= requestedQuantity;

    return {
      available,

      capacity: stats.capacity,

      reserved: stats.reserved,

      remaining: stats.remaining,

      requested: requestedQuantity,

      message: available
        ? undefined
        : `Il ne reste que ${stats.remaining} place${
            stats.remaining > 1 ? "s" : ""
          } disponible${
            stats.remaining > 1 ? "s" : ""
          }.`,
    };
  } catch (error) {
    console.error(
      "[SiloCamp] Erreur disponibilité :",
      error,
    );

    return {
      available: false,

      capacity: 1200,

      reserved: 0,

      remaining: 0,

      requested: requestedQuantity,

      message:
        "Impossible de vérifier la disponibilité des places.",
    };
  }
}

/**
 * =========================================================
 * CREATE TICKET
 * =========================================================
 */

export async function createTicket(
  input: CreateTicketInput,
): Promise<Ticket> {
  const firstName =
    input.firstName?.trim() || "";

  const lastName =
    input.lastName?.trim() || "";

  const participantName =
    input.participantName?.trim() ||
    `${firstName} ${lastName}`.trim();

  const email =
    normalizeEmail(input.email);

  const phone =
    normalizePhone(input.phone);

  const quantity =
    input.quantity ?? 1;

  if (!participantName) {
    throw new Error(
      "Le nom du participant est obligatoire.",
    );
  }

  if (!email) {
    throw new Error(
      "L'adresse e-mail est obligatoire.",
    );
  }

  if (!input.eventTitle?.trim()) {
    throw new Error(
      "Le titre de l'événement est obligatoire.",
    );
  }

  if (!input.dateLabel?.trim()) {
    throw new Error(
      "La date de l'événement est obligatoire.",
    );
  }

  if (!input.time?.trim()) {
    throw new Error(
      "L'heure de l'événement est obligatoire.",
    );
  }

  if (!input.venue?.trim()) {
    throw new Error(
      "Le lieu de l'événement est obligatoire.",
    );
  }

  if (!input.city?.trim()) {
    throw new Error(
      "La ville de l'événement est obligatoire.",
    );
  }

  if (
    !Number.isInteger(quantity) ||
    quantity !== 1
  ) {
    throw new Error(
      "Un seul billet peut être réservé par participant.",
    );
  }

  /**
   * Le backend reste la source de vérité.
   *
   * On fait une première vérification ici
   * pour éviter de créer inutilement une requête.
   */
  const availability =
    await checkTicketAvailability(quantity);

  if (!availability.available) {
    throw new Error(
      availability.message ||
        "Les places demandées ne sont plus disponibles.",
    );
  }

  const response =
    await apiRequest<CreateTicketResponse>(
      "/tickets",
      {
        method: "POST",

        body: JSON.stringify({
          firstName: firstName || undefined,

          lastName: lastName || undefined,

          participantName,

          email,

          phone,

          reservationId:
            input.reservationId?.trim() ||
            undefined,

          eventId:
            input.eventId?.trim() ||
            undefined,

          eventTitle:
            input.eventTitle.trim(),

          dateLabel:
            input.dateLabel.trim(),

          time:
            input.time.trim(),

          duration:
            input.duration?.trim() ||
            undefined,

          venue:
            input.venue.trim(),

          city:
            input.city.trim(),

          quantity,
        }),
      },
    );

  if (!response.success || !response.ticket) {
    throw new Error(
      response.message ||
        "Impossible de créer le billet.",
    );
  }

  return response.ticket;
}

/**
 * =========================================================
 * VERIFY TICKET
 * =========================================================
 *
 * IMPORTANT :
 *
 * Cette fonction utilise le verificationToken
 * présent dans le QR Code.
 *
 * Elle NE marque PAS le billet comme USED.
 *
 * Donc :
 *
 * Scan
 * ↓
 * Vérification
 * ↓
 * Billet VALID
 *
 * Le billet reste VALID.
 *
 * C'est uniquement le bouton "Valider l'entrée"
 * qui doit appeler useTicket().
 */

export async function verifyTicket(
  verificationToken: string,
): Promise<TicketVerificationResponse> {
  const token =
    verificationToken.trim();

  if (!token) {
    return {
      valid: false,

      reason: "TOKEN_REQUIRED",

      message:
        "Token de vérification manquant.",
    };
  }

  try {
    return await apiRequest<TicketVerificationResponse>(
      `/tickets/verify?token=${encodeURIComponent(
        token,
      )}`,
    );
  } catch (error) {
    console.error(
      "[SiloCamp] Erreur vérification billet :",
      error,
    );

    return {
      valid: false,

      reason: "NOT_FOUND",

      message:
        error instanceof Error
          ? error.message
          : "Impossible de vérifier le billet.",
    };
  }
}

/**
 * =========================================================
 * GET TICKET BY NUMBER
 * =========================================================
 */

export async function getTicketByNumber(
  ticketNumber: string,
): Promise<Ticket | null> {
  const value =
    ticketNumber.trim();

  if (!value) {
    return null;
  }

  try {
    return await apiRequest<Ticket>(
      `/tickets/number/${encodeURIComponent(
        value,
      )}`,
    );
  } catch (error) {
    console.error(
      "[SiloCamp] Billet introuvable :",
      error,
    );

    return null;
  }
}

/**
 * =========================================================
 * GET TICKETS BY EMAIL
 * =========================================================
 */

export async function getTicketByEmail(
  email: string,
): Promise<Ticket[]> {
  const normalizedEmail =
    normalizeEmail(email);

  if (!normalizedEmail) {
    return [];
  }

  return apiRequest<Ticket[]>(
    `/tickets/email/${encodeURIComponent(
      normalizedEmail,
    )}`,
  );
}

/**
 * =========================================================
 * GET TICKETS BY PHONE
 * =========================================================
 */

export async function getTicketByPhone(
  phone: string,
): Promise<Ticket[]> {
  const normalizedPhone =
    normalizePhone(phone);

  if (!normalizedPhone) {
    return [];
  }

  return apiRequest<Ticket[]>(
    `/tickets/phone/${encodeURIComponent(
      normalizedPhone,
    )}`,
  );
}

/**
 * =========================================================
 * GET TICKET BY ID
 * =========================================================
 *
 * Ton backend actuel ne possède pas encore :
 *
 * GET /api/tickets/:id
 *
 * Donc on récupère actuellement tous les billets
 * puis on cherche l'id côté frontend.
 *
 * Pour un petit volume cela fonctionne.
 *
 * Si tu veux, on pourra ensuite ajouter une route
 * Prisma dédiée.
 */

export async function getTicketById(
  ticketId: string,
): Promise<Ticket | null> {
  const id =
    ticketId.trim();

  if (!id) {
    return null;
  }

  try {
    const tickets =
      await getTickets();

    return (
      tickets.find(
        (ticket) =>
          ticket.id === id,
      ) || null
    );
  } catch (error) {
    console.error(
      "[SiloCamp] Erreur recherche ticket ID :",
      error,
    );

    return null;
  }
}

/**
 * =========================================================
 * GET TICKET BY RESERVATION ID
 * =========================================================
 */

export async function getTicketByReservationId(
  reservationId: string,
): Promise<Ticket | null> {
  const value =
    reservationId.trim();

  if (!value) {
    return null;
  }

  try {
    const tickets =
      await getTickets();

    return (
      tickets.find(
        (ticket) =>
          ticket.reservationId === value,
      ) || null
    );
  } catch (error) {
    console.error(
      "[SiloCamp] Erreur recherche réservation :",
      error,
    );

    return null;
  }
}

/**
 * =========================================================
 * GET TICKET BY VERIFICATION TOKEN
 * =========================================================
 */

export async function getTicketByVerificationToken(
  verificationToken: string,
): Promise<Ticket | null> {
  const token =
    verificationToken.trim();

  if (!token) {
    return null;
  }

  const result =
    await verifyTicket(token);

  return result.ticket || null;
}

/**
 * =========================================================
 * USE / VALIDATE TICKET
 * =========================================================
 *
 * ATTENTION :
 *
 * Cette fonction marque réellement le billet
 * comme USED.
 *
 * Elle doit être appelée UNIQUEMENT lorsque
 * l'organisateur valide l'entrée du participant.
 */

export async function useTicket(
  ticketNumber: string,
): Promise<{
  valid: boolean;
  reason?: string;
  message: string;
  ticket?: Ticket;
}> {
  const value =
    ticketNumber.trim();

  if (!value) {
    return {
      valid: false,

      reason: "TICKET_NUMBER_REQUIRED",

      message:
        "Numéro de billet manquant.",
    };
  }

  try {
    return await apiRequest<{
      valid: boolean;
      reason?: string;
      message: string;
      ticket?: Ticket;
    }>(
      `/tickets/${encodeURIComponent(
        value,
      )}/use`,
      {
        method: "PATCH",
      },
    );
  } catch (error) {
    console.error(
      "[SiloCamp] Erreur validation billet :",
      error,
    );

    return {
      valid: false,

      reason: "API_ERROR",

      message:
        error instanceof Error
          ? error.message
          : "Impossible de valider le billet.",
    };
  }
}

/**
 * =========================================================
 * CANCEL TICKET
 * =========================================================
 */

export async function cancelTicket(
  ticketNumber: string,
): Promise<{
  success: boolean;
  message: string;
  ticket?: Ticket;
}> {
  const value =
    ticketNumber.trim();

  if (!value) {
    return {
      success: false,

      message:
        "Numéro de billet manquant.",
    };
  }

  try {
    return await apiRequest<{
      success: boolean;
      message: string;
      ticket?: Ticket;
    }>(
      `/tickets/${encodeURIComponent(
        value,
      )}/cancel`,
      {
        method: "PATCH",
      },
    );
  } catch (error) {
    console.error(
      "[SiloCamp] Erreur annulation billet :",
      error,
    );

    return {
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Impossible d'annuler le billet.",
    };
  }
}

/**
 * =========================================================
 * HELPERS FRONTEND
 * =========================================================
 */

/**
 * Vérifie si un billet est réellement valide.
 *
 * VALID = utilisable
 * USED = déjà utilisé
 * CANCELLED = annulé
 */
export function isTicketValid(
  ticket?: Ticket | null,
): boolean {
  return ticket?.status === "VALID";
}

/**
 * Retourne le libellé utilisateur du statut.
 */
export function getTicketStatusLabel(
  status?: TicketStatus,
): string {
  switch (status) {
    case "VALID":
      return "Billet valide";

    case "USED":
      return "Billet déjà utilisé";

    case "CANCELLED":
      return "Billet annulé";

    default:
      return "Statut inconnu";
  }
}

/**
 * =========================================================
 * EXPORT DEFAULT
 * =========================================================
 */

const ticketService = {
  checkApiHealth,

  getTickets,

  getTicketStats,

  checkTicketAvailability,

  createTicket,

  verifyTicket,

  getTicketByNumber,

  getTicketByEmail,

  getTicketByPhone,

  getTicketById,

  getTicketByReservationId,

  getTicketByVerificationToken,

  useTicket,

  cancelTicket,

  isTicketValid,

  getTicketStatusLabel,

  generateReservationId,
};

export default ticketService;