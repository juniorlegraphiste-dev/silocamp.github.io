import { useEffect, useMemo, useState, type ReactNode } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import { QRCodeCanvas } from "qrcode.react";

import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Download,
  Home,
  Mail,
  MapPin,
  Ticket,
  User,
} from "lucide-react";

import { pdf } from "@react-pdf/renderer";

import { Reveal } from "@/components/Reveal";

import TicketPDF from "@/components/ticket/TicketPDF";

import {
  getTicketById,
  getTicketByNumber,
  type Ticket as SiloTicket,
} from "@/services/ticketService";

type ConfirmationState = {
  eventId?: string;
  ticketId?: string;
  ticketNumber?: string;
  verificationToken?: string;
  reservationId?: string;
  participantName?: string;
  email?: string;
  phone?: string;
};

type StoredOrder = {
  reservationId?: string;
  ticketId?: string;
  ticketNumber?: string;
  verificationToken?: string;
  participantName?: string;
  email?: string;
  phone?: string;
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        reject(new Error("Impossible de convertir le PDF en Base64."));
        return;
      }

      const base64 = result.replace(/^data:application\/pdf;base64,/i, "");

      resolve(base64);
    };

    reader.onerror = () => {
      reject(new Error("Erreur lors de la lecture du PDF."));
    };

    reader.readAsDataURL(blob);
  });
};

export default function Confirmation() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = (location.state ?? {}) as ConfirmationState;

  const [ticket, setTicket] = useState<SiloTicket | null>(null);

  const [loading, setLoading] = useState(true);

  const [ticketNotFound, setTicketNotFound] = useState(false);

  const [loadError, setLoadError] = useState("");

  const [emailSending, setEmailSending] = useState(false);

  const [emailSent, setEmailSent] = useState(false);

  const [emailError, setEmailError] = useState("");

  const identifiers = useMemo(() => {
    let ticketId = state.ticketId?.trim() || "";

    let ticketNumber = state.ticketNumber?.trim() || "";

    let verificationToken = state.verificationToken?.trim() || "";

    let reservationId = state.reservationId?.trim() || "";

    try {
      const rawOrder =
        sessionStorage.getItem("silocamp-last-order") ??
        sessionStorage.getItem("wg-last-order");

      if (rawOrder) {
        const order = JSON.parse(rawOrder) as StoredOrder;

        if (!ticketId && order.ticketId) {
          ticketId = order.ticketId.trim();
        }

        if (!ticketNumber && order.ticketNumber) {
          ticketNumber = order.ticketNumber.trim();
        }

        if (!verificationToken && order.verificationToken) {
          verificationToken = order.verificationToken.trim();
        }

        if (!reservationId && order.reservationId) {
          reservationId = order.reservationId.trim();
        }
      }
    } catch (error) {
      console.warn(
        "[SiloCamp] Impossible de lire la réservation sauvegardée.",
        error,
      );
    }

    return {
      ticketId,
      ticketNumber,
      verificationToken,
      reservationId,
    };
  }, [
    state.ticketId,
    state.ticketNumber,
    state.verificationToken,
    state.reservationId,
  ]);

  useEffect(() => {
    let cancelled = false;

    const loadTicket = async () => {
      setLoading(true);
      setTicketNotFound(false);
      setLoadError("");

      try {
        let foundTicket: SiloTicket | null = null;

        if (identifiers.ticketNumber) {
          foundTicket = await getTicketByNumber(identifiers.ticketNumber);
        }

        if (!foundTicket && identifiers.ticketId) {
          foundTicket = await getTicketById(identifiers.ticketId);
        }

        if (!foundTicket) {
          throw new Error("Impossible d'identifier votre billet.");
        }

        if (cancelled) {
          return;
        }

        setTicket(foundTicket);
        setTicketNotFound(false);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("[SiloCamp] Impossible de récupérer le billet.", error);

        setTicket(null);
        setTicketNotFound(true);

        setLoadError(
          error instanceof Error
            ? error.message
            : "Impossible de récupérer votre billet.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadTicket();

    return () => {
      cancelled = true;
    };
  }, [identifiers.ticketId, identifiers.ticketNumber]);

  if (loading) {
    return (
      <div className="container-px mx-auto flex min-h-[75vh] items-center justify-center py-32">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-gold-400/20 border-t-gold-300" />

          <p className="mt-4 text-sm text-cream-dim">
            Récupération de votre réservation...
          </p>

          <p className="mt-2 text-xs text-cream-faint">Connexion à SiloCamp</p>
        </div>
      </div>
    );
  }

  if (ticketNotFound || !ticket) {
    return (
      <div className="container-px mx-auto flex min-h-[75vh] max-w-2xl items-center justify-center py-32">
        <div className="w-full rounded-3xl border border-red-400/20 bg-red-400/5 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-400/10 text-red-300">
            <Ticket className="h-8 w-8" />
          </div>

          <h1 className="mt-6 font-display text-3xl text-cream">
            Billet introuvable
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-cream-dim">
            Nous n'avons pas pu récupérer votre billet depuis le serveur
            SiloCamp.
          </p>

          {loadError && (
            <div className="mt-5 rounded-2xl border border-red-400/10 bg-red-400/5 p-4">
              <p className="text-xs leading-relaxed text-red-300">
                {loadError}
              </p>
            </div>
          )}

          {identifiers.ticketNumber && (
            <div className="mt-5 rounded-2xl border border-gold-400/10 bg-ink-950/40 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-cream-faint">
                Numéro recherché
              </p>

              <p className="mt-2 break-all font-mono text-sm text-gold-300">
                {identifiers.ticketNumber}
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-ghost inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </button>

            <Link
              to="/"
              className="btn-gold inline-flex items-center justify-center gap-2"
            >
              <Home className="h-4 w-4" />
              Accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const ticketNumber =
    ticket.ticketNumber?.trim() || identifiers.ticketNumber.trim();

  const participantName =
    ticket.participantName ||
    [ticket.firstName, ticket.lastName].filter(Boolean).join(" ") ||
    state.participantName ||
    "Participant";

  const verificationToken =
    identifiers.verificationToken || ticket.verificationToken || "";

  const verificationUrl = verificationToken
    ? `${window.location.origin}/ticket/verify?token=${encodeURIComponent(
        verificationToken,
      )}`
    : "";

  const reservationId =
    ticket.reservationId ??
    identifiers.reservationId ??
    state.reservationId ??
    "";

  const downloadQRCode = () => {
    const canvas = document.getElementById(
      "silocamp-ticket-qr",
    ) as HTMLCanvasElement | null;

    if (!canvas) {
      console.error("[SiloCamp] QR Code introuvable.");

      return;
    }

    if (!verificationUrl) {
      console.error("[SiloCamp] Token de vérification indisponible.");

      return;
    }

    const url = canvas.toDataURL("image/png");

    const link = document.createElement("a");

    link.href = url;

    link.download = `${ticketNumber}-QR.png`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };

  const generateTicketPDF = async (): Promise<Blob> => {
    const canvas = document.getElementById(
      "silocamp-ticket-qr",
    ) as HTMLCanvasElement | null;

    if (!canvas) {
      throw new Error("Impossible de récupérer le QR Code.");
    }

    if (!verificationUrl) {
      throw new Error("Token de vérification indisponible.");
    }

    const qrCodeDataUrl = canvas.toDataURL("image/png");

    const pdfTicket: SiloTicket = {
      ...ticket,
      ticketNumber,
      participantName,
      reservationId: ticket.reservationId ?? identifiers.reservationId ?? null,
    };

    return pdf(
      <TicketPDF
        ticket={pdfTicket}
        verificationUrl={verificationUrl}
        qrCodeDataUrl={qrCodeDataUrl}
      />,
    ).toBlob();
  };

  const downloadPDF = async () => {
    try {
      const blob = await generateTicketPDF();

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = `${ticketNumber}-SiloCamp-2026.pdf`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("[SiloCamp] Impossible de générer le PDF.", error);
    }
  };

  const sendTicketByEmail = async () => {
    if (!ticket) {
      setEmailError("Billet introuvable.");
      return;
    }

    if (!ticket.email) {
      setEmailError("Aucune adresse e-mail n'est associée à ce billet.");
      return;
    }

    setEmailSending(true);
    setEmailSent(false);
    setEmailError("");

    try {
      const canvas = document.getElementById(
        "silocamp-ticket-qr",
      ) as HTMLCanvasElement | null;

      if (!canvas) {
        throw new Error("Impossible de récupérer le QR Code.");
      }

      if (!verificationUrl) {
        throw new Error("Le lien de vérification du billet est indisponible.");
      }

      // Génération du QR Code
      const qrCodeDataUrl = canvas.toDataURL("image/png");

      // Préparation du billet pour le PDF
      const pdfTicket: SiloTicket = {
        ...ticket,
        ticketNumber,
        participantName,
        reservationId:
          ticket.reservationId ?? identifiers.reservationId ?? null,
      };

      // Génération du PDF
      const blob = await pdf(
        <TicketPDF
          ticket={pdfTicket}
          verificationUrl={verificationUrl}
          qrCodeDataUrl={qrCodeDataUrl}
        />,
      ).toBlob();

      // Conversion navigateur -> Base64
      const pdfBase64 = await blobToBase64(blob);

      if (!pdfBase64) {
        throw new Error("Le PDF généré est vide.");
      }

      console.log("[SiloCamp] Envoi du billet par e-mail...");
      console.log("[SiloCamp] Ticket :", ticketNumber);
      console.log("[SiloCamp] Destinataire :", ticket.email);
      console.log("[SiloCamp] Taille PDF Base64 :", pdfBase64.length);

      const response = await fetch("/api/tickets/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketNumber,
          email: ticket.email,
          pdfBase64,
        }),
      });

      const data = await response.json().catch(() => null);

      console.log("[SiloCamp] Réponse API :", {
        status: response.status,
        data,
      });

      if (!response.ok) {
        throw new Error(
          data?.message || "Le service d'e-mail a refusé l'envoi du billet.",
        );
      }

      setEmailSent(true);
    } catch (error) {
      console.error(
        "[SiloCamp] Erreur lors de l'envoi du billet par e-mail.",
        error,
      );

      setEmailError(
        error instanceof Error
          ? error.message
          : "Le billet n'a pas pu être envoyé par e-mail.",
      );
    } finally {
      setEmailSending(false);
    }
  };

  const statusConfig = {
    VALID: {
      label: "Billet valide",
      className: "bg-emerald-500/15 text-emerald-300",
    },

    USED: {
      label: "Billet utilisé",
      className: "bg-amber-500/15 text-amber-300",
    },

    CANCELLED: {
      label: "Billet annulé",
      className: "bg-red-500/15 text-red-300",
    },
  } as const;

  const status = statusConfig[ticket.status];

  return (
    <div className="container-px mx-auto max-w-6xl pb-28 pt-28 md:pt-32 lg:pb-20">
      <Reveal className="text-center">
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
            ticket.status === "VALID"
              ? "bg-emerald-500/15 text-emerald-300"
              : ticket.status === "USED"
                ? "bg-amber-500/15 text-amber-300"
                : "bg-red-500/15 text-red-300"
          }`}
        >
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
          <BadgeCheck className="h-4 w-4" />
          Participation confirmée
        </span>

        <h1 className="mt-5 font-display text-4xl font-medium text-cream sm:text-5xl">
          Votre réservation est{" "}
          <span className="text-gold-gradient">confirmée</span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-cream-dim">
          Votre e-billet a été enregistré avec succès. Conservez ce billet et
          présentez le QR Code à l'entrée du Camp.
        </p>
      </Reveal>

      <Reveal className="mx-auto mt-12 max-w-4xl">
        <div className="overflow-hidden rounded-[2rem] border border-gold-400/15 bg-ink-900/60 shadow-2xl">
          <div className="border-b border-gold-400/10 bg-gold-400/5 p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gold-300">
                  Camp International Silo 2026
                </p>

                <h2 className="mt-2 font-display text-2xl text-cream sm:text-3xl">
                  {ticket.eventTitle}
                </h2>
              </div>

              <span
                className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider ${status.className}`}
              >
                <CheckCircle2 className="h-4 w-4" />
                {status.label}
              </span>
            </div>
          </div>

          <div className="grid gap-10 p-6 sm:p-8 lg:grid-cols-[1fr_280px]">
            <div>
              <div className="grid gap-5 sm:grid-cols-2">
                <InfoItem
                  icon={<User className="h-4 w-4" />}
                  label="Participant"
                  value={participantName}
                />

                <InfoItem
                  icon={<Ticket className="h-4 w-4" />}
                  label="Numéro du billet"
                  value={ticketNumber}
                />

                <InfoItem
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Date"
                  value={`${ticket.dateLabel} · ${ticket.time}`}
                />

                <InfoItem
                  icon={<MapPin className="h-4 w-4" />}
                  label="Lieu"
                  value={`${ticket.venue}, ${ticket.city}`}
                />
              </div>

              <div className="mt-5">
                <InfoItem
                  icon={<Mail className="h-4 w-4" />}
                  label="E-mail"
                  value={ticket.email}
                />
              </div>

              {ticket.phone && (
                <div className="mt-5">
                  <InfoItem
                    icon={<User className="h-4 w-4" />}
                    label="Téléphone"
                    value={ticket.phone}
                  />
                </div>
              )}

              <div className="mt-8 rounded-2xl border border-gold-400/10 bg-ink-950/40 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-cream-faint">
                  Réservation
                </p>

                <p className="mt-2 break-all font-mono text-sm text-gold-300">
                  {reservationId || "Réservation confirmée"}
                </p>
              </div>

              <div className="mt-8 rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-5">
                <div className="flex items-start gap-3">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />

                  <div>
                    <h3 className="font-medium text-cream">
                      Présentez ce QR Code à l'entrée
                    </h3>

                    <p className="mt-1 text-sm leading-relaxed text-cream-dim">
                      Le QR Code contient un lien sécurisé permettant à
                      l'organisation de vérifier votre billet directement depuis
                      le serveur SiloCamp.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="rounded-3xl bg-white p-5 shadow-xl">
                <QRCodeCanvas
                  id="silocamp-ticket-qr"
                  value={verificationUrl || ticketNumber}
                  size={220}
                  level="H"
                  includeMargin
                />
              </div>

              <p className="mt-4 max-w-[240px] text-center text-xs leading-relaxed text-cream-faint">
                Scannez ce QR Code pour ouvrir automatiquement la page de
                vérification.
              </p>

              <button
                type="button"
                onClick={downloadQRCode}
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-gold-400/20 px-4 py-2 text-xs font-medium text-cream transition hover:bg-gold-400/10"
              >
                <Download className="h-4 w-4" />
                Télécharger le QR Code
              </button>
            </div>
          </div>

          <div className="border-t border-gold-400/10 p-6 sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
              <button
                type="button"
                onClick={downloadPDF}
                className="btn-gold inline-flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                Télécharger le billet PDF
              </button>

              <button
                type="button"
                onClick={sendTicketByEmail}
                disabled={emailSending}
                className="btn-ghost inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Mail className="h-4 w-4" />

                {emailSending ? "Envoi en cours..." : "Recevoir par e-mail"}
              </button>
            </div>

            {emailSent && (
              <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  Billet envoyé avec succès
                </div>

                <p className="mt-1 text-center text-xs text-cream-dim">
                  Le billet PDF a été envoyé à <strong>{ticket.email}</strong>.
                </p>
              </div>
            )}

            {emailError && (
              <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/5 p-4">
                <p className="text-center text-sm text-red-300">{emailError}</p>
              </div>
            )}
          </div>
        </div>
      </Reveal>

      <Reveal className="mt-8 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-cream-dim transition hover:text-gold-300"
        >
          <Home className="h-4 w-4" />
          Retour à l'accueil
        </Link>
      </Reveal>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gold-400/10 bg-ink-950/40 p-4">
      <div className="flex items-center gap-2 text-gold-300">
        {icon}

        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>

      <p className="mt-2 break-words text-sm font-medium text-cream">{value}</p>
    </div>
  );
}
