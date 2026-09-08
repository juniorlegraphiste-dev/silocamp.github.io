import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";

type EmailRequestBody = {
  ticketNumber?: string;
  email?: string;
  pdfBase64?: string;
};

type TicketRow = {
  ticketNumber: string;
  verificationToken: string;
  participantName: string;
  email: string;
  eventTitle: string;
  dateLabel: string;
  time: string;
  duration: string | null;
  venue: string;
  city: string;
  reservationId: string | null;
  status: "VALID" | "USED" | "CANCELLED";
};

const SITE_URL = "https://silocamp-github-io.vercel.app";

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).json({
      ok: false,
      code: "METHOD_NOT_ALLOWED",
      message: "Méthode non autorisée.",
    });
  }

  try {
    const body = (req.body ?? {}) as EmailRequestBody;

    const ticketNumber = String(
      body.ticketNumber ?? "",
    ).trim();

    const email = normalizeEmail(
      String(body.email ?? ""),
    );

    const pdfBase64 = String(
      body.pdfBase64 ?? "",
    )
      .trim()
      .replace(/^data:application\/pdf;base64,/i, "");

    console.log("[SiloCamp Email] Nouvelle demande :", {
      ticketNumber,
      email,
      pdfLength: pdfBase64.length,
    });

    /*
    ============================================================
    VALIDATION
    ============================================================
    */

    if (!ticketNumber) {
      return res.status(400).json({
        ok: false,
        code: "TICKET_NUMBER_REQUIRED",
        message: "Numéro de billet manquant.",
      });
    }

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        ok: false,
        code: "INVALID_EMAIL",
        message: "Adresse e-mail invalide.",
      });
    }

    if (!pdfBase64) {
      return res.status(400).json({
        ok: false,
        code: "PDF_REQUIRED",
        message: "Le billet PDF est manquant.",
      });
    }

    /*
    IMPORTANT :

    La limite est volontairement assez basse afin
    d'éviter les problèmes de taille des requêtes Vercel.
    */

    if (pdfBase64.length > 4_500_000) {
      return res.status(413).json({
        ok: false,
        code: "PDF_TOO_LARGE",
        message:
          "Le billet PDF est trop volumineux pour être envoyé.",
      });
    }

    /*
    ============================================================
    ENVIRONMENT VARIABLES
    ============================================================
    */

    const databaseUrl = process.env.DATABASE_URL;
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!databaseUrl) {
      console.error(
        "[SiloCamp Email] DATABASE_URL manquante.",
      );

      return res.status(500).json({
        ok: false,
        code: "DATABASE_CONFIGURATION_ERROR",
        message:
          "La base de données SiloCamp n'est pas configurée.",
      });
    }

    if (!resendApiKey) {
      console.error(
        "[SiloCamp Email] RESEND_API_KEY manquante.",
      );

      return res.status(500).json({
        ok: false,
        code: "RESEND_API_KEY_MISSING",
        message:
          "Le service d'envoi d'e-mail n'est pas configuré.",
      });
    }

    if (!fromEmail) {
      console.error(
        "[SiloCamp Email] RESEND_FROM_EMAIL manquante.",
      );

      return res.status(500).json({
        ok: false,
        code: "RESEND_FROM_EMAIL_MISSING",
        message:
          "L'adresse d'expédition n'est pas configurée.",
      });
    }

    /*
    ============================================================
    NEON DATABASE
    ============================================================
    */

    const sql = neon(databaseUrl);

    const rows = await sql`
      SELECT
        "ticketNumber",
        "verificationToken",
        "participantName",
        "email",
        "eventTitle",
        "dateLabel",
        "time",
        "duration",
        "venue",
        "city",
        "reservationId",
        "status"
      FROM "Ticket"
      WHERE "ticketNumber" = ${ticketNumber}
      LIMIT 1
    `;

    if (!rows.length) {
      return res.status(404).json({
        ok: false,
        code: "TICKET_NOT_FOUND",
        message: "Billet introuvable.",
      });
    }

    const ticket = rows[0] as TicketRow;

    /*
    ============================================================
    SECURITY CHECK
    ============================================================
    */

    const ticketEmail = normalizeEmail(
      String(ticket.email ?? ""),
    );

    if (ticketEmail !== email) {
      console.warn(
        "[SiloCamp Email] EMAIL_MISMATCH",
        {
          ticketNumber,
          requestedEmail: email,
        },
      );

      return res.status(403).json({
        ok: false,
        code: "EMAIL_MISMATCH",
        message:
          "Cette adresse e-mail ne correspond pas au billet.",
      });
    }

    if (!ticket.verificationToken) {
      return res.status(500).json({
        ok: false,
        code: "VERIFICATION_TOKEN_MISSING",
        message:
          "Le token de vérification du billet est indisponible.",
      });
    }

    /*
    ============================================================
    VERIFICATION URL
    ============================================================
    */

    const verificationUrl =
      `${SITE_URL}/ticket/verify?token=` +
      encodeURIComponent(ticket.verificationToken);

    /*
    ============================================================
    EMAIL CONTENT
    ============================================================
    */

    const participantName = escapeHtml(
      ticket.participantName || "Participant",
    );

    const eventTitle = escapeHtml(
      ticket.eventTitle ||
        "Camp International Silo 2026",
    );

    const dateLabel = escapeHtml(
      ticket.dateLabel || "",
    );

    const time = escapeHtml(
      ticket.time || "",
    );

    const venue = escapeHtml(
      ticket.venue || "",
    );

    const city = escapeHtml(
      ticket.city || "",
    );

    const reservationId = escapeHtml(
      ticket.reservationId ||
        "Confirmation enregistrée",
    );

    const safeTicketNumber = escapeHtml(
      ticket.ticketNumber,
    );

    const emailHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Votre billet SiloCamp 2026</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f4f1f8;
    font-family:Arial,Helvetica,sans-serif;
    color:#171321;
  "
>

  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="background:#f4f1f8;padding:30px 15px;"
  >
    <tr>
      <td align="center">

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            max-width:620px;
            background:#ffffff;
            border-radius:20px;
            overflow:hidden;
          "
        >

          <tr>
            <td
              style="
                background:#17112b;
                padding:34px 30px;
                text-align:center;
              "
            >

              <div
                style="
                  font-size:13px;
                  letter-spacing:3px;
                  text-transform:uppercase;
                  color:#d9ad52;
                  font-weight:bold;
                "
              >
                CAMP INTERNATIONAL SILO 2026
              </div>

              <div
                style="
                  margin-top:12px;
                  font-size:28px;
                  line-height:1.25;
                  color:#ffffff;
                  font-weight:bold;
                "
              >
                Votre participation est confirmée
              </div>

            </td>
          </tr>

          <tr>
            <td style="padding:34px 30px;">

              <p
                style="
                  margin:0 0 18px;
                  font-size:17px;
                  line-height:1.6;
                "
              >
                Bonjour <strong>${participantName}</strong>,
              </p>

              <p
                style="
                  margin:0 0 24px;
                  font-size:15px;
                  line-height:1.7;
                  color:#5d5867;
                "
              >
                Votre inscription au
                <strong>${eventTitle}</strong>
                a bien été enregistrée.
                Votre billet PDF est joint à cet e-mail.
              </p>

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  background:#f8f6fb;
                  border-radius:14px;
                "
              >
                <tr>
                  <td style="padding:20px;">

                    <p
                      style="
                        margin:0;
                        font-size:11px;
                        text-transform:uppercase;
                        color:#8b8495;
                      "
                    >
                      Numéro du billet
                    </p>

                    <p
                      style="
                        margin:7px 0 20px;
                        font-size:18px;
                        font-weight:bold;
                        color:#241b40;
                      "
                    >
                      ${safeTicketNumber}
                    </p>

                    <p
                      style="
                        margin:0;
                        font-size:11px;
                        text-transform:uppercase;
                        color:#8b8495;
                      "
                    >
                      Réservation
                    </p>

                    <p
                      style="
                        margin:7px 0 20px;
                        font-size:14px;
                        font-weight:bold;
                        color:#241b40;
                      "
                    >
                      ${reservationId}
                    </p>

                    <p
                      style="
                        margin:0;
                        font-size:11px;
                        text-transform:uppercase;
                        color:#8b8495;
                      "
                    >
                      Date
                    </p>

                    <p
                      style="
                        margin:7px 0 20px;
                        font-size:14px;
                        color:#241b40;
                      "
                    >
                      ${dateLabel} · ${time}
                    </p>

                    <p
                      style="
                        margin:0;
                        font-size:11px;
                        text-transform:uppercase;
                        color:#8b8495;
                      "
                    >
                      Lieu
                    </p>

                    <p
                      style="
                        margin:7px 0 0;
                        font-size:14px;
                        color:#241b40;
                      "
                    >
                      ${venue}, ${city}
                    </p>

                  </td>
                </tr>
              </table>

              <div
                style="
                  text-align:center;
                  margin:30px 0;
                "
              >

                <a
                  href="${verificationUrl}"
                  style="
                    display:inline-block;
                    background:#c89b3c;
                    color:#ffffff;
                    text-decoration:none;
                    padding:14px 24px;
                    border-radius:10px;
                    font-size:14px;
                    font-weight:bold;
                  "
                >
                  Vérifier mon billet
                </a>

              </div>

              <p
                style="
                  margin:25px 0 0;
                  font-size:13px;
                  line-height:1.7;
                  color:#77717f;
                  text-align:center;
                "
              >
                Présentez le QR Code présent sur votre billet
                à l'entrée du Camp.
              </p>

            </td>
          </tr>

          <tr>
            <td
              style="
                background:#17112b;
                padding:22px 30px;
                text-align:center;
              "
            >

              <div
                style="
                  font-size:12px;
                  color:#aaa3b6;
                "
              >
                SiloCamp · Camp International Silo 2026
              </div>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;

    /*
    ============================================================
    RESEND
    ============================================================
    */

    console.log(
      "[SiloCamp Email] Envoi vers Resend...",
    );

    const resendResponse = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          from: fromEmail,

          to: [email],

          subject: "🎟️ Votre billet SiloCamp 2026",

          html: emailHtml,

          attachments: [
            {
              filename:
                `${ticket.ticketNumber}-SiloCamp-2026.pdf`,

              content: pdfBase64,

              content_type: "application/pdf",
            },
          ],
        }),
      },
    );

    const resendText =
      await resendResponse.text();

    let resendData: unknown = resendText;

    try {
      resendData = JSON.parse(resendText);
    } catch {
      // La réponse n'est pas du JSON.
    }

    if (!resendResponse.ok) {
      console.error(
        "[SiloCamp Email] Resend ERROR:",
        {
          status: resendResponse.status,
          data: resendData,
        },
      );

      return res.status(502).json({
        ok: false,
        code: "EMAIL_SEND_FAILED",
        message:
          "Le service d'e-mail a refusé l'envoi du billet.",

        debug:
          process.env.NODE_ENV === "development"
            ? resendData
            : undefined,
      });
    }

    console.log(
      "[SiloCamp Email] Billet envoyé avec succès :",
      ticket.ticketNumber,
    );

    return res.status(200).json({
      ok: true,

      message:
        "Votre billet a été envoyé avec succès par e-mail.",

      ticketNumber: ticket.ticketNumber,

      email,
    });
  } catch (error) {
    console.error(
      "[SiloCamp Email] ERREUR SERVEUR :",
      error,
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error);

    return res.status(500).json({
      ok: false,
      code: "EMAIL_SERVER_ERROR",

      message:
        "Une erreur est survenue lors de l'envoi du billet.",

      error:
        process.env.NODE_ENV === "development"
          ? errorMessage
          : undefined,
    });
  }
}