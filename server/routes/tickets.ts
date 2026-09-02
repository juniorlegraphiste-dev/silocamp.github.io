import { Router } from "express";
import { prisma } from "../db";

const router = Router();

const MAX_TICKETS = 1200;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone?: string): string | undefined {
  if (!phone) {
    return undefined;
  }

  const normalized = phone.replace(/[^\d+]/g, "").trim();

  return normalized || undefined;
}

function generateVerificationToken(): string {
  return `${crypto.randomUUID().replace(/-/g, "")}${crypto
    .randomUUID()
    .replace(/-/g, "")}`;
}

function generateTicketNumber(): string {
  const year = new Date().getFullYear();

  const randomPart = crypto
    .randomUUID()
    .replace(/-/g, "")
    .substring(0, 8)
    .toUpperCase();

  return `SILO-${year}-${randomPart}`;
}

router.get("/", async (_req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(tickets);
  } catch (error) {
    console.error("[GET /api/tickets]", error);

    return res.status(500).json({
      message: "Impossible de récupérer les billets.",
    });
  }
});

router.get("/stats", async (_req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      select: {
        quantity: true,
        status: true,
      },
    });

    const reserved = tickets
      .filter((ticket) => ticket.status === "VALID")
      .reduce((total, ticket) => total + ticket.quantity, 0);

    const used = tickets
      .filter((ticket) => ticket.status === "USED")
      .reduce((total, ticket) => total + ticket.quantity, 0);

    const validTickets = tickets.filter(
      (ticket) => ticket.status === "VALID",
    ).length;

    const usedTickets = tickets.filter(
      (ticket) => ticket.status === "USED",
    ).length;

    const cancelledTickets = tickets.filter(
      (ticket) => ticket.status === "CANCELLED",
    ).length;

    return res.json({
      capacity: MAX_TICKETS,
      totalTickets: tickets.length,
      validTickets,
      usedTickets,
      cancelledTickets,
      reserved,
      used,
      remaining: Math.max(0, MAX_TICKETS - reserved),
    });
  } catch (error) {
    console.error("[GET /api/tickets/stats]", error);

    return res.status(500).json({
      message: "Impossible de récupérer les statistiques.",
    });
  }
});

router.get("/verify", async (req, res) => {
  try {
    const token =
      typeof req.query.token === "string" ? req.query.token.trim() : "";

    if (!token) {
      return res.status(400).json({
        valid: false,
        reason: "TOKEN_REQUIRED",
        message: "Token de vérification manquant.",
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: {
        verificationToken: token,
      },
    });

    if (!ticket) {
      return res.status(404).json({
        valid: false,
        reason: "NOT_FOUND",
        message: "Billet introuvable.",
      });
    }

    if (ticket.status === "CANCELLED") {
      return res.status(400).json({
        valid: false,
        reason: "CANCELLED",
        message: "Ce billet a été annulé.",
        ticket,
      });
    }

    if (ticket.status === "USED") {
      return res.status(400).json({
        valid: false,
        reason: "USED",
        message: "Ce billet a déjà été utilisé.",
        ticket,
      });
    }

    return res.json({
      valid: true,
      reason: null,
      message: "Billet valide.",
      ticket,
    });
  } catch (error) {
    console.error("[GET /api/tickets/verify]", error);

    return res.status(500).json({
      valid: false,
      message: "Erreur lors de la vérification du billet.",
    });
  }
});

router.get("/number/:ticketNumber", async (req, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: {
        ticketNumber: req.params.ticketNumber,
      },
    });

    if (!ticket) {
      return res.status(404).json({
        message: "Billet introuvable.",
      });
    }

    return res.json(ticket);
  } catch (error) {
    console.error("[GET /api/tickets/number/:ticketNumber]", error);

    return res.status(500).json({
      message: "Impossible de récupérer le billet.",
    });
  }
});

router.get("/email/:email", async (req, res) => {
  try {
    const email = normalizeEmail(req.params.email);

    const tickets = await prisma.ticket.findMany({
      where: {
        email,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(tickets);
  } catch (error) {
    console.error("[GET /api/tickets/email/:email]", error);

    return res.status(500).json({
      message: "Impossible de rechercher les billets.",
    });
  }
});

router.get("/phone/:phone", async (req, res) => {
  try {
    const phone = normalizePhone(req.params.phone);

    if (!phone) {
      return res.status(400).json({
        message: "Numéro de téléphone invalide.",
      });
    }

    const tickets = await prisma.ticket.findMany({
      where: {
        phone,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(tickets);
  } catch (error) {
    console.error("[GET /api/tickets/phone/:phone]", error);

    return res.status(500).json({
      message: "Impossible de rechercher les billets.",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      participantName,
      email,
      phone,
      reservationId,
      eventId,
      eventTitle,
      dateLabel,
      time,
      duration,
      venue,
      city,
      quantity = 1,
    } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        message: "L'adresse e-mail est obligatoire.",
      });
    }

    if (!eventTitle || typeof eventTitle !== "string") {
      return res.status(400).json({
        message: "Le titre de l'événement est obligatoire.",
      });
    }

    if (!dateLabel || typeof dateLabel !== "string") {
      return res.status(400).json({
        message: "La date de l'événement est obligatoire.",
      });
    }

    if (!time || typeof time !== "string") {
      return res.status(400).json({
        message: "L'heure de l'événement est obligatoire.",
      });
    }

    if (!venue || typeof venue !== "string") {
      return res.status(400).json({
        message: "Le lieu de l'événement est obligatoire.",
      });
    }

    if (!city || typeof city !== "string") {
      return res.status(400).json({
        message: "La ville de l'événement est obligatoire.",
      });
    }

    if (!Number.isInteger(quantity) || quantity !== 1) {
      return res.status(400).json({
        message: "Un seul billet peut être réservé par participant.",
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phone);

    const first = typeof firstName === "string" ? firstName.trim() : "";
    const last = typeof lastName === "string" ? lastName.trim() : "";

    const participant =
      typeof participantName === "string"
        ? participantName.trim()
        : `${first} ${last}`.trim();

    if (!participant) {
      return res.status(400).json({
        message: "Le nom du participant est obligatoire.",
      });
    }

    const existingEmail = await prisma.ticket.findFirst({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingEmail) {
      return res.status(409).json({
        message:
          "Cette adresse e-mail a déjà été utilisée pour une participation.",
      });
    }

    if (normalizedPhone) {
      const existingPhone = await prisma.ticket.findFirst({
        where: {
          phone: normalizedPhone,
        },
      });

      if (existingPhone) {
        return res.status(409).json({
          message:
            "Ce numéro de téléphone a déjà été utilisé pour une participation.",
        });
      }
    }

    if (reservationId) {
      const existingReservation = await prisma.ticket.findUnique({
        where: {
          reservationId,
        },
      });

      if (existingReservation) {
        return res.status(409).json({
          message: "Cette réservation existe déjà.",
        });
      }
    }

    const reservedResult = await prisma.ticket.aggregate({
      _sum: {
        quantity: true,
      },
      where: {
        status: "VALID",
      },
    });

    const reserved = reservedResult._sum.quantity ?? 0;

    if (reserved + quantity > MAX_TICKETS) {
      return res.status(409).json({
        message: "Il n'y a plus suffisamment de places disponibles.",
        capacity: MAX_TICKETS,
        reserved,
        remaining: Math.max(0, MAX_TICKETS - reserved),
      });
    }

    let ticketNumber = generateTicketNumber();

    while (
      await prisma.ticket.findUnique({
        where: {
          ticketNumber,
        },
      })
    ) {
      ticketNumber = generateTicketNumber();
    }

    let verificationToken = generateVerificationToken();

    while (
      await prisma.ticket.findUnique({
        where: {
          verificationToken,
        },
      })
    ) {
      verificationToken = generateVerificationToken();
    }

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        verificationToken,

        firstName: first || null,
        lastName: last || null,
        participantName: participant,

        email: normalizedEmail,
        phone: normalizedPhone ?? null,

        reservationId: reservationId?.trim() || null,

        eventId: eventId || null,
        eventTitle: eventTitle.trim(),
        dateLabel: dateLabel.trim(),
        time: time.trim(),
        duration: duration?.trim() || null,
        venue: venue.trim(),
        city: city.trim(),

        quantity,

        status: "VALID",
      },
    });

    return res.status(201).json({
      success: true,
      message: "Billet créé avec succès.",
      ticket,
    });
  } catch (error) {
    console.error("[POST /api/tickets]", error);

    return res.status(500).json({
      message: "Impossible de créer le billet.",
    });
  }
});

router.patch("/:ticketNumber/use", async (req, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: {
        ticketNumber: req.params.ticketNumber,
      },
    });

    if (!ticket) {
      return res.status(404).json({
        valid: false,
        reason: "NOT_FOUND",
        message: "Billet introuvable.",
      });
    }

    if (ticket.status === "CANCELLED") {
      return res.status(400).json({
        valid: false,
        reason: "CANCELLED",
        message: "Ce billet a été annulé.",
        ticket,
      });
    }

    if (ticket.status === "USED") {
      return res.status(400).json({
        valid: false,
        reason: "USED",
        message: "Ce billet a déjà été utilisé.",
        ticket,
      });
    }

    const updatedTicket = await prisma.ticket.update({
      where: {
        id: ticket.id,
      },
      data: {
        status: "USED",
        usedAt: new Date(),
      },
    });

    return res.json({
      valid: true,
      message: "Billet validé et marqué comme utilisé.",
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("[PATCH /api/tickets/:ticketNumber/use]", error);

    return res.status(500).json({
      message: "Impossible de valider le billet.",
    });
  }
});

router.patch("/:ticketNumber/cancel", async (req, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: {
        ticketNumber: req.params.ticketNumber,
      },
    });

    if (!ticket) {
      return res.status(404).json({
        message: "Billet introuvable.",
      });
    }

    if (ticket.status === "USED") {
      return res.status(400).json({
        message: "Un billet déjà utilisé ne peut pas être annulé.",
      });
    }

    if (ticket.status === "CANCELLED") {
      return res.json({
        success: true,
        message: "Le billet est déjà annulé.",
        ticket,
      });
    }

    const updatedTicket = await prisma.ticket.update({
      where: {
        id: ticket.id,
      },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    return res.json({
      success: true,
      message: "Billet annulé avec succès.",
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("[PATCH /api/tickets/:ticketNumber/cancel]", error);

    return res.status(500).json({
      message: "Impossible d'annuler le billet.",
    });
  }
});

export default router;
