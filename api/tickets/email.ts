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
    return res.status(405).json({
      ok: false,
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

    if (pdfBase64.length > 5_500_000) {
      return res.status(413).json({
        ok: false,
        code: "PDF_TOO_LARGE",
        message: "Le billet PDF est trop volumineux.",
      });
    }

    const databaseUrl = process.env.DATABASE_URL;
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!databaseUrl) {
      console.error("[SiloCamp Email] DATABASE_URL manquante.");

      return res.status(500).json({
        ok: false,
        code: "DATABASE_CONFIGURATION_ERROR",
        message: "Configuration de la base de données incomplète.",
      });
    }

    if (!resendApiKey || !fromEmail) {
      console.error(
        "[SiloCamp Email] Configuration Resend manquante.",
      );

      return res.status(500).json({
        ok: false,
        code: "EMAIL_CONFIGURATION_ERROR",
        message: "Configuration de l'envoi d'e-mail incomplète.",
      });
    }

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

    const ticketEmail = normalizeEmail(
      String(ticket.email ?? ""),
    );

    if (ticketEmail !== email) {
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

    const verificationUrl =
      `${SITE_URL}/ticket/verify?token=` +
      encodeURIComponent(ticket.verificationToken);

    const participantName = escapeHtml(
      ticket.participantName || "Participant",
    );

    const eventTitle = escapeHtml(
      ticket.eventTitle || "Camp International Silo 2026",
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
      ticket.reservationId || "Confirmation enregistrée",
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
                Vous trouverez votre e-billet PDF en pièce jointe
                de cet e-mail.
              </p>

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  background:#f8f6fb;
                  border-radius:14px;
                  margin-bottom:25px;
                "
              >
                <tr>
                  <td style="padding:20px;">

                    <div
                      style="
                        font-size:11px;
                        text-transform:uppercase;
                        letter-spacing:1.5px;
                        color:#8b8495;
                      "
                    >
                      Billet
                    </div>

                    <div
                      style="
                        margin-top:6px;
                        font-size:18px;
                        font-weight:bold;
                        color:#241b40;
                      "
                    >
                      ${escapeHtml(ticket.ticketNumber)}
                    </div>

                    <div
                      style="
                        margin-top:18px;
                        font-size:11px;
                        text-transform:uppercase;
                        letter-spacing:1.5px;
                        color:#8b8495;
                      "
                    >
                      Réservation
                    </div>

                    <div
                      style="
                        margin-top:6px;
                        font-size:14px;
                        font-weight:bold;
                        color:#241b40;
                      "
                    >
                      ${reservationId}
                    </div>

                    <div
                      style="
                        margin-top:18px;
                        font-size:11px;
                        text-transform:uppercase;
                        letter-spacing:1.5px;
                        color:#8b8495;
                      "
                    >
                      Date
                    </div>

                    <div
                      style="
                        margin-top:6px;
                        font-size:14px;
                        color:#241b40;
                      "
                    >
                      ${dateLabel} · ${time}
                    </div>

                    <div
                      style="
                        margin-top:18px;
                        font-size:11px;
                        text-transform:uppercase;
                        letter-spacing:1.5px;
                        color:#8b8495;
                      "
                    >
                      Lieu
                    </div>

                    <div
                      style="
                        margin-top:6px;
                        font-size:14px;
                        color:#241b40;
                      "
                    >
                      ${venue}, ${city}
                    </div>

                  </td>
                </tr>
              </table>

              <div style="text-align:center;margin:30px 0;">

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
                  line-height:1.6;
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
          subject: "Votre billet SiloCamp 2026",
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

    let resendData: unknown = null;

    try {
      resendData = await resendResponse.json();
    } catch {
      resendData = null;
    }

    if (!resendResponse.ok) {
      console.error(
        "[SiloCamp Email] Resend error:",
        resendData,
      );

      return res.status(502).json({
        ok: false,
        code: "EMAIL_SEND_FAILED",
        message:
          "Le billet n'a pas pu être envoyé par e-mail.",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Billet envoyé avec succès.",
      ticketNumber: ticket.ticketNumber,
      email,
    });
  } catch (error) {
    console.error(
      "[SiloCamp Email] Erreur serveur:",
      error,
    );

    return res.status(500).json({
      ok: false,
      code: "EMAIL_SERVER_ERROR",
      message:
        "Une erreur est survenue lors de l'envoi du billet.",
    });
  }
}