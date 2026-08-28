import { Router } from "express";
import { prisma } from "../db";

const router = Router();

const MAX_TICKETS = 1500;

function generateVerificationToken(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID().replace(/-/g, "");
  }

  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 18)
  );
}

function generateTicketNumber(): string {
  const year = new Date().getFullYear();

  const randomPart = generateVerificationToken()
    .substring(0, 8)
    .toUpperCase();

  return `SILO-${year}-${randomPart}`;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone?: string): string | undefined {
  if (!phone) {
    return undefined;
  }

  return phone.replace(/[^\d+]/g, "").trim();
}

router.get("/stats", async (_req, res) => {
  try {
    const [
      totalTickets,
      validTickets,
      usedTickets,
      cancelledTickets,
    ] = await Promise.all([
      prisma.ticket.count(),

      prisma.ticket.count({
        where: {
          status: "VALID",
        },
      }),

      prisma.ticket.count({
        where: {
          status: "USED",
        },
      }),

      prisma.ticket.count({
        where: {
          status: "CANCELLED",
        },
      }),
    ]);

    const reservedResult = await prisma.ticket.aggregate({
      where: {
        status: "VALID",
      },
      _sum: {
        quantity: true,
      },
    });

    const usedResult = await prisma.ticket.aggregate({
      where: {
        status: "USED",
      },
      _sum: {
        quantity: true,
      },
    });

    const reserved = reservedResult._sum.quantity ?? 0;
    const used = usedResult._sum.quantity ?? 0;

    return res.json({
      totalTickets,
      validTickets,
      usedTickets,
      cancelledTickets,
      reserved,
      used,
      remaining: Math.max(0, MAX_TICKETS - reserved),
      capacity: MAX_TICKETS,
    });
  } catch (error) {
    console.error("[SiloCamp API] Stats error:", error);

    return res.status(500).json({
      message: "Impossible de récupérer les statistiques.",
    });
  }
});

router.get("/verify/:token", async (req, res) => {
  try {
    const token = req.params.token?.trim();

    if (!token) {
      return res.status(400).json({
        valid: false,
        reason: "NOT_FOUND",
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
      return res.status(409).json({
        valid: false,
        reason: "CANCELLED",
        ticket,
        message: "Ce billet a été annulé.",
      });
    }

    if (ticket.status === "USED") {
      return res.status(409).json({
        valid: false,
        reason: "USED",
        ticket,
        message: "Ce billet a déjà été utilisé.",
      });
    }

    return res.json({
      valid: true,
      ticket,
      message: "Billet valide.",
    });
  } catch (error) {
    console.error("[SiloCamp API] Verify error:", error);

    return res.status(500).json({
      valid: false,
      message: "Erreur lors de la vérification du billet.",
    });
  }
});

router.get("/number/:ticketNumber", async (req, res) => {
  try {
    const ticketNumber = req.params.ticketNumber?.trim();

    if (!ticketNumber) {
      return res.status(400).json({
        message: "Numéro de billet manquant.",
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: {
        ticketNumber,
      },
    });

    if (!ticket) {
      return res.status(404).json({
        message: "Billet introuvable.",
      });
    }

    return res.json(ticket);
  } catch (error) {
    console.error("[SiloCamp API] Ticket number error:", error);

    return res.status(500).json({
      message: "Impossible de récupérer le billet.",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!ticket) {
      return res.status(404).json({
        message: "Billet introuvable.",
      });
    }

    return res.json(ticket);
  } catch (error) {
    console.error("[SiloCamp API] Ticket ID error:", error);

    return res.status(500).json({
      message: "Impossible de récupérer le billet.",
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
        message: "Le nom de l'événement est obligatoire.",
      });
    }

    if (!dateLabel || !time || !venue || !city) {
      return res.status(400).json({
        message: "Les informations de l'événement sont incomplètes.",
      });
    }

    if (!Number.isInteger(quantity) || quantity !== 1) {
      return res.status(400).json({
        message:
          "Une seule place peut être réservée par participant.",
      });
    }

    const reservedResult = await prisma.ticket.aggregate({
      where: {
        status: "VALID",
      },
      _sum: {
        quantity: true,
      },
    });

    const reserved = reservedResult._sum.quantity ?? 0;

    if (reserved + quantity > MAX_TICKETS) {
      return res.status(409).json({
        message:
          "Le nombre maximum de participants a été atteint.",
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phone);

    const existingEmail = await prisma.ticket.findFirst({
      where: {
        email: normalizedEmail,
        status: {
          not: "CANCELLED",
        },
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
          status: {
            not: "CANCELLED",
          },
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

    const finalParticipantName =
      participantName?.trim() ||
      [firstName?.trim(), lastName?.trim()]
        .filter(Boolean)
        .join(" ");

    if (!finalParticipantName) {
      return res.status(400).json({
        message: "Le nom du participant est obligatoire.",
      });
    }

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: generateTicketNumber(),

        verificationToken: generateVerificationToken(),

        firstName: firstName?.trim() || null,

        lastName: lastName?.trim() || null,

        participantName: finalParticipantName,

        email: normalizedEmail,

        phone: normalizedPhone || null,

        reservationId: reservationId?.trim() || null,

        eventId: eventId || null,

        eventTitle,

        dateLabel,

        time,

        duration: duration || null,

        venue,

        city,

        quantity,

        status: "VALID",
      },
    });

    return res.status(201).json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error("[SiloCamp API] Create ticket error:", error);

    return res.status(500).json({
      message: "Impossible de créer le billet.",
    });
  }
});

router.post("/:id/use", async (req, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: {
        id: req.params.id,
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
      return res.status(409).json({
        valid: false,
        reason: "CANCELLED",
        ticket,
        message: "Ce billet a été annulé.",
      });
    }

    if (ticket.status === "USED") {
      return res.status(409).json({
        valid: false,
        reason: "USED",
        ticket,
        message: "Ce billet a déjà été utilisé.",
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
      ticket: updatedTicket,
      message: "Billet validé et enregistré comme utilisé.",
    });
  } catch (error) {
    console.error("[SiloCamp API] Use ticket error:", error);

    return res.status(500).json({
      message: "Impossible de valider le billet.",
    });
  }
});

router.post("/:id/cancel", async (req, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!ticket) {
      return res.status(404).json({
        message: "Billet introuvable.",
      });
    }

    if (ticket.status === "USED") {
      return res.status(409).json({
        message:
          "Un billet déjà utilisé ne peut pas être annulé.",
      });
    }

    if (ticket.status === "CANCELLED") {
      return res.json({
        success: true,
        ticket,
        message: "Le billet est déjà annulé.",
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
      ticket: updatedTicket,
      message: "Billet annulé.",
    });
  } catch (error) {
    console.error("[SiloCamp API] Cancel ticket error:", error);

    return res.status(500).json({
      message: "Impossible d'annuler le billet.",
    });
  }
});

export default router;