import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Download,
  Home,
  MapPin,
  Printer,
  Ticket,
  User,
} from "lucide-react";
import { pdf } from "@react-pdf/renderer";

import { Reveal } from "@/components/Reveal";
import {
  getTicketById,
  getTicketByNumber,
  getVerificationUrl,
  type Ticket as SiloTicket,
} from "@/services/ticketService";
import TicketPDF from "@/components/ticket/TicketPDF";

type ConfirmationState = {
  eventId?: string;
  ticketId?: string;
  ticketNumber?: string;
  reservationId?: string;
  participantName?: string;
  email?: string;
  phone?: string;
};

export default function Confirmation() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = (location.state ?? {}) as ConfirmationState;

  const [ticket, setTicket] = useState<SiloTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [ticketNotFound, setTicketNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadTicket() {
      setLoading(true);
      setTicketNotFound(false);

      try {
        let foundTicket: SiloTicket | null = null;

        if (state.ticketId) {
          foundTicket = await getTicketById(state.ticketId);
        }

        if (!foundTicket && state.ticketNumber) {
          foundTicket = await getTicketByNumber(
            state.ticketNumber,
          );
        }

        if (!foundTicket) {
          try {
            const rawOrder =
              sessionStorage.getItem("silocamp-last-order") ??
              sessionStorage.getItem("wg-last-order");

            if (rawOrder) {
              const order = JSON.parse(rawOrder);

              if (order.ticketNumber) {
                foundTicket = await getTicketByNumber(
                  order.ticketNumber,
                );
              }

              if (!foundTicket && order.ticketId) {
                foundTicket = await getTicketById(
                  order.ticketId,
                );
              }
            }
          } catch (error) {
            console.error(
              "[SiloCamp] Impossible de récupérer la réservation.",
              error,
            );
          }
        }

        if (cancelled) {
          return;
        }

        if (foundTicket) {
          setTicket(foundTicket);
          setTicketNotFound(false);
        } else {
          setTicket(null);
          setTicketNotFound(true);
        }
      } catch (error) {
        console.error(
          "[SiloCamp] Erreur lors de la récupération du billet.",
          error,
        );

        if (!cancelled) {
          setTicket(null);
          setTicketNotFound(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTicket();

    return () => {
      cancelled = true;
    };
  }, [state.ticketId, state.ticketNumber]);

  if (loading) {
    return (
      <div className="container-px mx-auto flex min-h-[75vh] items-center justify-center py-32">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-gold-400/20 border-t-gold-300" />

          <p className="mt-4 text-sm text-cream-dim">
            Vérification de votre réservation...
          </p>
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
            Nous n'avons pas pu retrouver votre billet.
            Votre réservation n'est peut-être plus disponible
            ou les informations de confirmation sont invalides.
          </p>

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

  const participantName =
    ticket.participantName ||
    [ticket.firstName, ticket.lastName]
      .filter(Boolean)
      .join(" ") ||
    "Participant";

  const verificationUrl = getVerificationUrl(ticket);

  const downloadQRCode = () => {
    const canvas = document.getElementById(
      "silocamp-ticket-qr",
    ) as HTMLCanvasElement | null;

    if (!canvas) {
      return;
    }

    const url = canvas.toDataURL("image/png");

    const link = document.createElement("a");
    link.href = url;
    link.download = `${ticket.ticketNumber}-QR.png`;
    link.click();
  };

  const downloadPDF = async () => {
    try {
      const blob = await pdf(
        <TicketPDF
          ticket={ticket}
          verificationUrl={verificationUrl}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${ticket.ticketNumber}-SiloCamp-2026.pdf`;
      link.click();

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error(
        "[SiloCamp] Impossible de générer le PDF.",
        error,
      );
    }
  };

  return (
    <div className="container-px mx-auto max-w-6xl pb-28 pt-28 md:pt-32 lg:pb-20">
      <Reveal className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
          <BadgeCheck className="h-4 w-4" />
          Participation confirmée
        </span>

        <h1 className="mt-5 font-display text-4xl font-medium text-cream sm:text-5xl">
          Votre réservation est{" "}
          <span className="text-gold-gradient">
            confirmée
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-cream-dim">
          Votre e-billet a été généré avec succès. Conservez
          ce billet et présentez le QR Code à l'entrée du Camp.
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

              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                {ticket.status === "VALID"
                  ? "Billet valide"
                  : ticket.status}
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
                  value={ticket.ticketNumber}
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

              <div className="mt-8 rounded-2xl border border-gold-400/10 bg-ink-950/40 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-cream-faint">
                  Réservation
                </p>

                <p className="mt-2 font-mono text-sm text-gold-300">
                  {ticket.reservationId ||
                    state.reservationId ||
                    "Réservation confirmée"}
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
                      Le QR Code contient un lien sécurisé
                      permettant à l'organisation de vérifier
                      votre billet.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="rounded-3xl bg-white p-5 shadow-xl">
                <QRCodeCanvas
                  id="silocamp-ticket-qr"
                  value={verificationUrl}
                  size={220}
                  level="H"
                  includeMargin
                />
              </div>

              <p className="mt-4 max-w-[240px] text-center text-xs leading-relaxed text-cream-faint">
                Scannez ce QR Code pour ouvrir automatiquement
                la page de vérification.
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

          <div className="flex flex-col gap-3 border-t border-gold-400/10 p-6 sm:flex-row sm:justify-end sm:p-8">
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
              onClick={() => window.print()}
              className="btn-ghost inline-flex items-center justify-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Imprimer
            </button>
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
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gold-400/10 bg-ink-950/40 p-4">
      <div className="flex items-center gap-2 text-gold-300">
        {icon}

        <span className="text-xs uppercase tracking-wider">
          {label}
        </span>
      </div>

      <p className="mt-2 break-words text-sm font-medium text-cream">
        {value}
      </p>
    </div>
  );
}