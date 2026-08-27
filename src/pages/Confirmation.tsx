/**
 * =========================================================
 * CONFIRMATION — SILOCAMP
 * =========================================================
 *
 * Page de confirmation d'inscription.
 *
 * Fonctionnalités :
 * - Récupération depuis location.state
 * - Récupération depuis sessionStorage
 * - Compatibilité silocamp-last-order / wg-last-order
 * - Vérification réelle du billet via ticketService
 * - Affichage du billet
 * - QR Code réel avec qrcode.react
 * - Téléchargement du QR Code
 * - Téléchargement du billet PDF
 * - Impression du billet
 * - PDF généré avec @react-pdf/renderer
 * - Une seule page A4
 * - Design premium violet / or
 * - Gestion propre de l'accès direct
 * - Protection contre les fausses confirmations
 * - Responsive mobile / desktop
 *
 * Aucun paiement réel n'est traité.
 * =========================================================
 */

import { useEffect, useRef, useState, type ReactNode } from "react";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Home,
  Loader2,
  MapPin,
  Printer,
  ShieldCheck,
  Ticket,
  UserRound,
} from "lucide-react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import { QRCodeCanvas } from "qrcode.react";

import { pdf } from "@react-pdf/renderer";

import TicketPDF from "@/components/ticket/TicketPDF";

import { getTicketById, getTicketByNumber } from "@/services/ticketService";

/* =========================================================
   TYPES
========================================================= */

type ConfirmationState = {
  eventId?: string;
  ticketId?: string;
  ticketNumber?: string;
  reservationId?: string;
  participantName?: string;
  email?: string;
  phone?: string;
};

type StoredOrder = ConfirmationState & {
  id?: string;
  createdAt?: string;
};

/* =========================================================
   HELPERS — SESSION STORAGE
========================================================= */

/**
 * Récupère proprement une réservation depuis sessionStorage.
 *
 * On supporte volontairement les deux clés :
 *
 * - silocamp-last-order
 * - wg-last-order
 */
function getStoredOrder(): StoredOrder | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storageKeys = ["silocamp-last-order", "wg-last-order"];

  for (const key of storageKeys) {
    try {
      const raw = window.sessionStorage.getItem(key);

      if (!raw) {
        continue;
      }

      const parsed = JSON.parse(raw);

      if (parsed && typeof parsed === "object") {
        return parsed as StoredOrder;
      }
    } catch (error) {
      console.error(`[SiloCamp] Impossible de lire ${key} :`, error);
    }
  }

  return null;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function Confirmation() {
  const location = useLocation();
  const navigate = useNavigate();

  /* =======================================================
     REFS
  ======================================================= */

  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  /* =======================================================
     ÉTAT
  ======================================================= */

  const [loading, setLoading] = useState(true);

  const [ticketNotFound, setTicketNotFound] = useState(false);

  const [isDownloading, setIsDownloading] = useState(false);

  const [downloaded, setDownloaded] = useState(false);

  const [storedOrder, setStoredOrder] = useState<StoredOrder | null>(null);

  const [ticket, setTicket] = useState<ReturnType<
    typeof getTicketByNumber
  > | null>(null);

  /* =======================================================
     NAVIGATION STATE
  ======================================================= */

  const navigationState = (location.state as ConfirmationState | null) ?? null;

  /* =======================================================
     RÉCUPÉRATION ET VÉRIFICATION
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadConfirmation = () => {
      try {
        /*
         * ---------------------------------------------------
         * 1. Récupération depuis sessionStorage
         * ---------------------------------------------------
         */

        const storageOrder = getStoredOrder();

        if (cancelled) {
          return;
        }

        setStoredOrder(storageOrder);

        /*
         * ---------------------------------------------------
         * 2. Fusion des sources
         *
         * Priorité :
         *
         * location.state
         *       ↓
         * sessionStorage
         * ---------------------------------------------------
         */

        const confirmationData: ConfirmationState = {
          ...storageOrder,
          ...navigationState,
        };

        /*
         * ---------------------------------------------------
         * 3. Recherche du billet
         * ---------------------------------------------------
         */

        let foundTicket: ReturnType<typeof getTicketByNumber> | null = null;

        /*
         * Priorité 1 : ticketId
         */

        if (confirmationData.ticketId) {
          foundTicket = getTicketById(confirmationData.ticketId);
        }

        /*
         * Priorité 2 : ticketNumber
         */

        if (!foundTicket && confirmationData.ticketNumber) {
          foundTicket = getTicketByNumber(confirmationData.ticketNumber);
        }

        /*
         * ---------------------------------------------------
         * 4. Vérification réelle
         * ---------------------------------------------------
         *
         * On ne fait JAMAIS confiance uniquement à
         * sessionStorage.
         */

        if (!foundTicket) {
          setTicket(null);
          setTicketNotFound(true);
          setLoading(false);
          return;
        }

        /*
         * ---------------------------------------------------
         * 5. Billet valide
         * ---------------------------------------------------
         */

        setTicket(foundTicket);
        setTicketNotFound(false);
        setLoading(false);
      } catch (error) {
        console.error("[SiloCamp] Erreur chargement confirmation :", error);

        if (!cancelled) {
          setTicket(null);
          setTicketNotFound(true);
          setLoading(false);
        }
      }
    };

    /*
     * Petit délai afin de laisser le ticketService et le
     * stockage être complètement disponibles après la
     * navigation du Checkout.
     */

    const timer = window.setTimeout(loadConfirmation, 100);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [location.state]);

  /* =======================================================
     DONNÉES DU BILLET
  ======================================================= */

  const confirmationData: ConfirmationState = {
    ...storedOrder,
    ...navigationState,
  };

  /*
   * Si le service retourne un reservationId, on l'utilise.
   * Sinon on récupère celui du Checkout/sessionStorage.
   */

  const reservationId =
    ticket?.reservationId ||
    confirmationData.reservationId ||
    ticket?.ticketNumber ||
    confirmationData.ticketNumber ||
    "";

  const participantName =
    ticket?.participantName ||
    confirmationData.participantName ||
    "Participant";

  const participantEmail = ticket?.email || confirmationData.email || "";

  const participantPhone = ticket?.phone || confirmationData.phone || "";

  const ticketNumber =
    ticket?.ticketNumber || confirmationData.ticketNumber || "";

  /*
   * QR Code.
   *
   * Le numéro unique du billet reste la référence principale
   * utilisée par le système de validation.
   */

  const qrValue = ticketNumber ? `SILOCAMP:TICKET:${ticketNumber}` : "";

  /* =======================================================
     TÉLÉCHARGEMENT QR CODE
  ======================================================= */

  const downloadQRCode = () => {
    const canvas = qrCanvasRef.current;

    if (!canvas) {
      window.alert("Le QR Code n'est pas encore prêt. Veuillez réessayer.");

      return;
    }

    if (!ticketNumber) {
      window.alert("Numéro de billet introuvable.");

      return;
    }

    try {
      const image = canvas.toDataURL("image/png");

      const link = document.createElement("a");

      link.href = image;

      link.download = `${ticketNumber}-SiloCamp-QR.png`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      setDownloaded(true);
    } catch (error) {
      console.error("[SiloCamp] Erreur téléchargement QR Code :", error);

      window.alert("Impossible de télécharger le QR Code.");
    }
  };

  /* =======================================================
     TÉLÉCHARGEMENT DU BILLET PDF
  ======================================================= */

  const downloadTicketPDF = async () => {
    if (!ticket) {
      window.alert("Billet introuvable.");

      return;
    }

    if (!ticketNumber) {
      window.alert("Numéro de billet introuvable.");

      return;
    }

    if (!qrCanvasRef.current) {
      window.alert(
        "Le QR Code n'est pas encore prêt. Veuillez patienter puis réessayer.",
      );

      return;
    }

    try {
      setIsDownloading(true);

      /*
       * Laisser le navigateur terminer le rendu du QR Code.
       */

      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 150);
      });

      const qrCanvas = qrCanvasRef.current;

      if (!qrCanvas) {
        throw new Error("QR Code introuvable.");
      }

      const qrCodeDataUrl = qrCanvas.toDataURL("image/png");

      /*
       * Création du document PDF.
       */

      const pdfDocument = (
        <TicketPDF
          ticketNumber={ticket.ticketNumber}
          participantName={ticket.participantName}
          email={ticket.email}
          phone={ticket.phone}
          eventTitle={ticket.eventTitle}
          dateLabel={ticket.dateLabel}
          time={ticket.time}
          duration={ticket.duration}
          venue={ticket.venue}
          city={ticket.city}
          quantity={ticket.quantity}
          qrCodeDataUrl={qrCodeDataUrl}
          reservationId={ticket.reservationId}
          createdAt={ticket.createdAt}
        />
      );

      const blob = await pdf(pdfDocument).toBlob();

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = `${ticketNumber}-SiloCamp-2026.pdf`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);

      setDownloaded(true);

      console.info(`[SiloCamp] Billet PDF téléchargé : ${ticketNumber}`);
    } catch (error) {
      console.error("[SiloCamp] Erreur génération du billet PDF :", error);

      window.alert("Impossible de télécharger le billet. Veuillez réessayer.");
    } finally {
      setIsDownloading(false);
    }
  };

  /* =======================================================
     IMPRESSION
  ======================================================= */

  const printTicket = () => {
    if (!ticket) {
      window.alert("Billet introuvable.");

      return;
    }

    window.print();
  };

  /* =======================================================
     CHARGEMENT
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 px-6">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold-400/20 bg-gold-400/5">
            <Loader2 className="h-6 w-6 animate-spin text-gold-300" />
          </div>

          <p className="mt-5 text-sm text-cream-dim">
            Vérification de votre e-billet...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     BILLET INTROUVABLE
  ======================================================= */

  if (ticketNotFound || !ticket) {
    return (
      <div className="container-px mx-auto flex min-h-[75vh] max-w-2xl items-center justify-center py-28">
        <div className="w-full rounded-3xl border border-red-400/20 bg-red-400/5 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-400/10 text-red-300">
            <Ticket className="h-7 w-7" />
          </div>

          <h1 className="mt-6 font-display text-3xl text-cream">
            Billet introuvable
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-cream-dim">
            Aucun billet valide n&apos;a été trouvé pour cette confirmation.
            Cette page ne peut pas afficher une confirmation sans réservation
            réellement enregistrée.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/evenements"
              className="btn-gold inline-flex items-center justify-center gap-2"
            >
              Voir les événements
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <Link
              to="/"
              className="btn-ghost inline-flex items-center justify-center gap-2"
            >
              <Home className="h-4 w-4" />
              Accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      {/* ===================================================
          PRINT CSS
      =================================================== */}

      <style>
        {`
          @media print {

            @page {
              size: A4 portrait;
              margin: 6mm;
            }

            html,
            body {
              width: 210mm !important;
              min-height: 297mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }

            body {
              overflow: hidden !important;
            }

            body * {
              visibility: hidden;
            }

            #silocamp-print-ticket,
            #silocamp-print-ticket * {
              visibility: visible;
            }

            #silocamp-print-ticket {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            .silocamp-print-hidden {
              display: none !important;
            }

            .silocamp-ticket {
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              border: 1px solid #d4af37 !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              background: white !important;
              color: black !important;
            }

            .silocamp-ticket * {
              color: black !important;
              border-color: #dddddd !important;
            }

            .silocamp-ticket-qr {
              background: white !important;
              border-color: #dddddd !important;
              box-shadow: none !important;
            }

            .silocamp-ticket-section {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
          }
        `}
      </style>

      {/* ===================================================
          PAGE
      =================================================== */}

      <main className="min-h-screen bg-ink-950 px-4 pb-16 pt-24 sm:px-6 md:pt-28">
        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="silocamp-print-hidden mx-auto mb-6 flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-gold-400/15 bg-gold-400/5 px-4 py-2.5 text-sm text-cream-dim transition hover:border-gold-400/30 hover:text-cream"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>

          <div className="flex flex-wrap gap-2">
            {/* QR */}

            <button
              type="button"
              onClick={downloadQRCode}
              className="inline-flex items-center gap-2 rounded-full border border-gold-400/20 bg-gold-400/5 px-4 py-2.5 text-sm font-medium text-gold-300 transition hover:bg-gold-400/10"
            >
              <Download className="h-4 w-4" />

              {downloaded ? "QR Code téléchargé" : "Télécharger QR"}
            </button>

            {/* IMPRESSION */}

            <button
              type="button"
              onClick={printTicket}
              className="inline-flex items-center gap-2 rounded-full border border-gold-400/20 bg-gold-400/5 px-4 py-2.5 text-sm font-medium text-gold-300 transition hover:bg-gold-400/10"
            >
              <Printer className="h-4 w-4" />
              Imprimer
            </button>

            {/* PDF */}

            <button
              type="button"
              onClick={downloadTicketPDF}
              disabled={isDownloading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-400 px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-gold-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Télécharger le billet
                </>
              )}
            </button>
          </div>
        </div>

        {/* =================================================
            BILLET
        ================================================= */}

        <div
          id="silocamp-print-ticket"
          className="mx-auto w-full max-w-[794px]"
        >
          <div className="silocamp-ticket overflow-hidden rounded-[2rem] border border-gold-400/20 bg-ink-900 shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
            {/* HEADER */}

            <div className="silocamp-ticket-section relative overflow-hidden border-b border-gold-400/15 bg-gradient-to-br from-gold-400/10 via-transparent to-gold-400/5 px-6 py-6 sm:px-9">
              <div className="relative flex items-start justify-between gap-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold-400/20 bg-gold-400/10">
                    <Ticket className="h-5 w-5 text-gold-300" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-300">
                      SiloCamp
                    </p>

                    <p className="mt-0.5 text-[11px] text-cream-faint">
                      E-billet officiel
                    </p>
                  </div>
                </div>

                <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {ticket.status || "Confirmé"}
                  </span>
                </div>
              </div>
            </div>

            {/* TITRE */}

            <div className="silocamp-ticket-section px-6 pt-6 text-center sm:px-9">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold-300">
                Participation gratuite
              </p>

              <h1 className="mt-2 font-display text-3xl font-medium leading-tight text-cream sm:text-4xl">
                {ticket.eventTitle}
              </h1>

              <p className="mt-2 text-sm text-cream-dim">
                Camp International Silo 2026
              </p>
            </div>

            {/* QR CODE */}

            <div className="silocamp-ticket-section flex justify-center px-6 py-6 sm:px-9">
              <div
                id="silocamp-ticket-qr"
                className="silocamp-ticket-qr rounded-3xl border border-gold-400/20 bg-white p-4 shadow-xl"
              >
                <QRCodeCanvas
                  ref={qrCanvasRef}
                  value={qrValue}
                  size={190}
                  bgColor="#ffffff"
                  fgColor="#111111"
                  level="H"
                  includeMargin
                />
              </div>
            </div>

            {/* NUMÉRO */}

            <div className="silocamp-ticket-section px-6 text-center sm:px-9">
              <p className="text-xs text-cream-faint">
                Présentez ce QR Code à l&apos;accueil du Camp.
              </p>

              <p className="mt-2 break-all font-mono text-sm font-semibold tracking-wider text-gold-300">
                {ticketNumber}
              </p>
            </div>

            {/* PARTICIPANT */}

            <div className="silocamp-ticket-section px-6 py-6 sm:px-9">
              <div className="rounded-2xl border border-gold-400/10 bg-ink-950/50 p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-400/10 text-gold-300">
                    <UserRound className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cream-faint">
                      Participant
                    </p>

                    <h2 className="mt-1 font-display text-xl text-cream">
                      {participantName}
                    </h2>

                    {participantEmail && (
                      <p className="mt-1 break-all text-sm text-cream-dim">
                        {participantEmail}
                      </p>
                    )}

                    {participantPhone && (
                      <p className="mt-1 text-xs text-cream-faint">
                        {participantPhone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* INFORMATIONS */}

            <div className="silocamp-ticket-section px-6 pb-6 sm:px-9">
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoCard
                  icon={<CalendarDays className="h-5 w-5" />}
                  label="Date"
                  value={ticket.dateLabel}
                />

                <InfoCard
                  icon={<Clock3 className="h-5 w-5" />}
                  label="Heure"
                  value={ticket.time}
                />

                <InfoCard
                  icon={<MapPin className="h-5 w-5" />}
                  label="Lieu"
                  value={ticket.venue}
                />

                <InfoCard
                  icon={<MapPin className="h-5 w-5" />}
                  label="Ville"
                  value={ticket.city}
                />
              </div>
            </div>

            {/* IDENTIFIANTS */}

            <div className="silocamp-ticket-section border-y border-gold-400/10 bg-gold-400/5 px-6 py-5 sm:px-9">
              <div className="grid gap-5 sm:grid-cols-3">
                <TicketDetail label="Réservation" value={reservationId} />

                <TicketDetail label="Billet" value={ticketNumber} />

                <TicketDetail label="Tarif" value="Gratuit" highlight />
              </div>
            </div>

            {/* DÉTAILS */}

            <div className="silocamp-ticket-section px-6 py-5 sm:px-9">
              <div className="grid gap-5 sm:grid-cols-2">
                <TicketDetail label="Type" value="Participation" />

                <TicketDetail
                  label="Quantité"
                  value={`${ticket.quantity ?? 1} billet`}
                />
              </div>
            </div>

            {/* SÉCURITÉ */}

            <div className="silocamp-ticket-section px-6 py-6 sm:px-9">
              <div className="flex items-start gap-4 rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
                  <ShieldCheck className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="font-medium text-cream">Billet sécurisé</h3>

                  <p className="mt-1 text-xs leading-relaxed text-cream-dim">
                    Ce billet possède un QR Code unique. Il sera vérifié à
                    l&apos;entrée du Camp afin de confirmer votre participation.
                  </p>
                </div>
              </div>
            </div>

            {/* FOOTER */}

            <div className="silocamp-ticket-section border-t border-gold-400/10 px-6 py-5 text-center sm:px-9">
              <p className="text-xs leading-relaxed text-cream-faint">
                Conservez précieusement ce billet jusqu&apos;au jour de
                l&apos;événement.
              </p>

              <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-gold-300">
                SiloCamp · Camp International Silo 2026
              </p>

              <p className="mt-2 text-[10px] text-cream-faint">
                Billet généré le {formatDate(ticket.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* =================================================
            ACTIONS FINALES
        ================================================= */}

        <div className="silocamp-print-hidden mx-auto mt-7 flex max-w-3xl flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="btn-ghost inline-flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" />
            Retour à l&apos;accueil
          </Link>

          <button
            type="button"
            onClick={printTicket}
            className="btn-ghost inline-flex items-center justify-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimer
          </button>

          <button
            type="button"
            onClick={downloadTicketPDF}
            disabled={isDownloading}
            className="btn-gold inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Génération du PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Télécharger mon billet
              </>
            )}
          </button>
        </div>
      </main>
    </>
  );
}

/* =========================================================
   INFO CARD
========================================================= */

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <div className="rounded-2xl border border-gold-400/10 bg-ink-950/40 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-400/10 text-gold-300">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-cream-faint">
            {label}
          </p>

          <p className="mt-1 break-words text-sm font-medium text-cream">
            {value || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   TICKET DETAIL
========================================================= */

function TicketDetail({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cream-faint">
        {label}
      </p>

      <p
        className={`mt-1 break-all font-medium ${
          highlight ? "text-emerald-300" : "text-cream"
        }`}
      >
        {value || "—"}
      </p>
    </div>
  );
}

/* =========================================================
   DATE
========================================================= */

function formatDate(value?: string): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
