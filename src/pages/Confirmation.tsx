import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Mail,
  MapPin,
  Phone,
  Printer,
  QrCode,
  Ticket as TicketIcon,
  User,
} from "lucide-react";

import {
  getTicketById,
  getTicketByNumber,
  verifyTicket,
  getVerificationUrl,
  type Ticket,
} from "../services/ticketService";
import TicketPDF from "@/components/ticket/TicketPDF";

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

type StoredOrder = ConfirmationState;

function readStoredOrder(): StoredOrder | null {
  try {
    const keys = ["silocamp-last-order", "wg-last-order"];

    for (const key of keys) {
      const raw = sessionStorage.getItem(key);

      if (!raw) {
        continue;
      }

      const parsed = JSON.parse(raw);

      if (parsed && typeof parsed === "object") {
        return parsed as StoredOrder;
      }
    }

    return null;
  } catch (error) {
    console.error("Erreur lecture réservation :", error);
    return null;
  }
}

function formatDate(value: string | Date | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Une erreur est survenue lors de la récupération de votre réservation.";
}

export default function Confirmation() {
  const navigate = useNavigate();
  const location = useLocation();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [storedOrder, setStoredOrder] = useState<StoredOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrDownloaded, setQrDownloaded] = useState(false);

  const locationState = (location.state ?? {}) as ConfirmationState;

  useEffect(() => {
    let cancelled = false;

    async function loadTicket() {
      setLoading(true);
      setError("");

      try {
        const sessionOrder = readStoredOrder();

        if (cancelled) {
          return;
        }

        const order: StoredOrder = {
          ...(sessionOrder ?? {}),
          ...locationState,
        };

        setStoredOrder(order);

        let foundTicket: Ticket | null = null;

        /*
         * 1. Recherche par ticketId
         */
        if (order.ticketId) {
          try {
            foundTicket = await getTicketById(order.ticketId);
          } catch (ticketIdError) {
            console.warn("Recherche par ticketId impossible :", ticketIdError);
          }
        }

        /*
         * 2. Recherche par ticketNumber
         */
        if (!foundTicket && order.ticketNumber) {
          try {
            foundTicket = await getTicketByNumber(order.ticketNumber);
          } catch (ticketNumberError) {
            console.warn(
              "Recherche par ticketNumber impossible :",
              ticketNumberError,
            );
          }
        }

        /*
         * 3. Recherche par verificationToken
         */
        if (!foundTicket && order.verificationToken) {
          try {
            const verification = await verifyTicket(order.verificationToken);

            if (verification.valid && verification.ticket) {
              foundTicket = verification.ticket;
            }
          } catch (verificationError) {
            console.warn(
              "Vérification par token impossible :",
              verificationError,
            );
          }
        }

        if (cancelled) {
          return;
        }

        if (!foundTicket) {
          setError(
            "Votre réservation n'a pas pu être retrouvée. Vérifiez que vous avez bien terminé votre réservation.",
          );
          setTicket(null);
          return;
        }

        setTicket(foundTicket);
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        console.error("Erreur Confirmation :", loadError);

        setTicket(null);
        setError(getErrorMessage(loadError));
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
  }, [
    locationState.ticketId,
    locationState.ticketNumber,
    locationState.verificationToken,
  ]);

  const verificationUrl = useMemo(() => {
    if (!ticket) {
      return "";
    }

    return getVerificationUrl(ticket);
  }, [ticket]);

  function downloadQRCode() {
    const canvas = document.getElementById(
      "silocamp-ticket-qr",
    ) as HTMLCanvasElement | null;

    if (!canvas || !ticket) {
      return;
    }

    try {
      const link = document.createElement("a");

      link.download = `${ticket.ticketNumber}-QRCode.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      setQrDownloaded(true);

      window.setTimeout(() => {
        setQrDownloaded(false);
      }, 2500);
    } catch (downloadError) {
      console.error("Erreur téléchargement QR :", downloadError);
      alert("Impossible de télécharger le QR Code.");
    }
  }

  function printTicket() {
    window.print();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-xl p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-700" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Confirmation de votre réservation
          </h1>

          <p className="mt-3 text-slate-500">
            Nous récupérons votre billet sécurisé...
          </p>
        </div>
      </main>
    );
  }

  if (error || !ticket) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-xl p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <TicketIcon className="h-8 w-8 text-red-600" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Réservation introuvable
          </h1>

          <p className="mt-4 text-slate-500 leading-7">
            {error ||
              "Impossible de retrouver votre billet. Votre réservation n'a peut-être pas encore été enregistrée."}
          </p>

          {storedOrder?.ticketNumber && (
            <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Numéro de billet recherché
              </p>

              <p className="mt-1 font-mono font-bold text-slate-900">
                {storedOrder.ticketNumber}
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à l'accueil
            </button>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex-1 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Réessayer
            </button>
          </div>
        </div>
      </main>
    );
  }

  const participantName =
    ticket.participantName ||
    `${ticket.firstName ?? ""} ${ticket.lastName ?? ""}`.trim() ||
    storedOrder?.participantName ||
    "Participant";

  const reservationId =
    ticket.reservationId || storedOrder?.reservationId || "—";

  const createdAt = formatDate(ticket.createdAt);

  function getQRCodeDataUrl(): string | null {
    const canvas = document.getElementById(
      "silocamp-ticket-qr",
    ) as HTMLCanvasElement | null;

    if (!canvas) {
      return null;
    }

    try {
      return canvas.toDataURL("image/png");
    } catch (error) {
      console.error("Erreur lors de la récupération du QR Code :", error);
      return null;
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 print:bg-white print:py-0">
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center print:hidden">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-11 w-11 text-emerald-600" />
          </div>

          <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-violet-700">
            SiloCamp 2026
          </p>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-950">
            Réservation confirmée !
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg leading-7 text-slate-500">
            Félicitations{" "}
            <strong className="text-slate-800">{participantName}</strong>. Votre
            participation au Camp International Silo 2026 est confirmée.
          </p>
        </div>

        {/* Ticket */}
        <section
          id="silocamp-ticket"
          className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl print:rounded-none print:border-0 print:shadow-none"
        >
          {/* Ticket Header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-violet-950 via-violet-900 to-slate-950 px-6 py-8 sm:px-10 sm:py-10 text-white">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl" />

            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-violet-200">
                  Billet officiel
                </p>

                <h2 className="mt-2 text-2xl sm:text-3xl font-black">
                  Camp International Silo 2026
                </h2>

                <p className="mt-2 text-violet-200">
                  Votre accès officiel à l'événement
                </p>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-200">
                <CheckCircle2 className="h-4 w-4" />
                VALIDE
              </div>
            </div>
          </div>

          {/* Ticket Body */}
          <div className="grid lg:grid-cols-[1fr_280px]">
            <div className="p-6 sm:p-10">
              {/* Participant */}
              <div className="mb-8">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-violet-700">
                  <User className="h-4 w-4" />
                  Participant
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-slate-950">
                  {participantName}
                </h3>
              </div>

              {/* Event details */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Date
                  </p>

                  <p className="mt-2 font-bold text-slate-900">
                    {ticket.dateLabel || "—"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Heure
                  </p>

                  <p className="mt-2 font-bold text-slate-900">
                    {ticket.time || "—"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <MapPin className="h-4 w-4" />
                    Lieu
                  </div>

                  <p className="mt-2 font-bold text-slate-900">
                    {ticket.venue || "—"}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {ticket.city || "—"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Durée
                  </p>

                  <p className="mt-2 font-bold text-slate-900">
                    {ticket.duration || "—"}
                  </p>
                </div>
              </div>

              {/* Contact */}
              <div className="mt-6 grid sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>

                  <p className="mt-2 break-all font-medium text-slate-800">
                    {ticket.email || "—"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <Phone className="h-4 w-4" />
                    Téléphone
                  </div>

                  <p className="mt-2 font-medium text-slate-800">
                    {ticket.phone || "—"}
                  </p>
                </div>
              </div>

              {/* Identifiers */}
              <div className="mt-6 border-t border-dashed border-slate-300 pt-6">
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Numéro de réservation
                    </p>

                    <p className="mt-1 break-all font-mono text-sm font-bold text-slate-900">
                      {reservationId}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Numéro de billet
                    </p>

                    <p className="mt-1 break-all font-mono text-sm font-bold text-violet-800">
                      {ticket.ticketNumber}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Réservation créée le
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {createdAt}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Quantité
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {ticket.quantity} place
                      {ticket.quantity > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* QR */}
            <div className="border-t lg:border-t-0 lg:border-l border-dashed border-slate-300 bg-slate-50 p-6 sm:p-10 flex flex-col items-center justify-center">
              <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-violet-800">
                <QrCode className="h-4 w-4" />
                QR Code
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
                <QRCodeCanvas
                  id="silocamp-ticket-qr"
                  value={verificationUrl}
                  size={220}
                  level="H"
                  includeMargin
                />
              </div>

              <p className="mt-5 max-w-[220px] text-center text-xs leading-5 text-slate-500">
                Présentez ce QR Code à l'entrée pour contrôler votre billet.
              </p>

              <p className="mt-3 text-center font-mono text-[10px] break-all text-slate-400">
                {ticket.verificationToken}
              </p>
            </div>
          </div>

          {/* Ticket Footer */}
          <div className="border-t border-slate-200 bg-violet-950 px-6 py-5 sm:px-10 text-center text-sm text-violet-100">
            <p className="font-semibold">Camp International Silo 2026</p>

            <p className="mt-1 text-violet-300">
              Ce billet est nominatif et associé à une réservation unique.
            </p>
          </div>
        </section>

        {/* Actions */}
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
          <PDFDownloadLink
            document={
              <TicketPDF
                ticket={ticket}
                verificationUrl={verificationUrl}
                qrCodeDataUrl={getQRCodeDataUrl() ?? undefined}
              />
            }
            fileName={`${ticket.ticketNumber}-SiloCamp-2026.pdf`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3.5 font-bold text-white transition hover:bg-violet-800"
          >
            {({ loading: pdfLoading }) => (
              <>
                <Download className="h-5 w-5" />
                {pdfLoading ? "Préparation..." : "Télécharger PDF"}
              </>
            )}
          </PDFDownloadLink>

          <button
            type="button"
            onClick={downloadQRCode}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 font-bold text-slate-800 transition hover:bg-slate-50"
          >
            <QrCode className="h-5 w-5" />
            {qrDownloaded ? "QR téléchargé" : "Télécharger QR"}
          </button>

          <button
            type="button"
            onClick={printTicket}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 font-bold text-slate-800 transition hover:bg-slate-50"
          >
            <Printer className="h-5 w-5" />
            Imprimer
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 font-bold text-white transition hover:bg-slate-800"
          >
            <ArrowLeft className="h-5 w-5" />
            Accueil
          </button>
        </div>

        {/* Email notice */}
        <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4 text-center print:hidden">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-violet-900">
            <Mail className="h-4 w-4 shrink-0" />
            <span>
              Conservez ce billet et votre QR Code pour le contrôle à l'entrée.
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }

          body {
            background: white !important;
          }

          #silocamp-ticket {
            width: 100%;
            max-width: none;
          }

          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </main>
  );
}
