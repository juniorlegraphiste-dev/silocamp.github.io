import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { verifyTicket } from "@/services/ticketService";

/* ============================================================
   TYPES
============================================================ */

type VerifyState =
  | "loading"
  | "valid"
  | "used"
  | "cancelled"
  | "not-found"
  | "error"
  | "missing-token";

type TicketStatus = "VALID" | "USED" | "CANCELLED";

type TicketData = {
  id?: string;
  ticketNumber?: string;
  verificationToken?: string;

  firstName?: string | null;
  lastName?: string | null;
  participantName?: string;

  email?: string;
  phone?: string | null;

  reservationId?: string | null;
  eventId?: string | null;
  eventTitle?: string;

  dateLabel?: string;
  time?: string;
  duration?: string | null;

  venue?: string;
  city?: string;

  quantity?: number;
  childrenUnder12?: number;
  children12Plus?: number;

  status?: TicketStatus;

  createdAt?: string;
  usedAt?: string | null;
  cancelledAt?: string | null;
};

type VerifyResult = {
  ok?: boolean;
  valid?: boolean;

  ticket?: TicketData;

  status?: TicketStatus;

  reason?: string;
  message?: string;
};

/* ============================================================
   HELPERS
============================================================ */

function normalizeReason(reason?: string) {
  return (reason ?? "").trim().toUpperCase();
}

function normalizeStatus(status?: string) {
  return (status ?? "").trim().toUpperCase();
}

function formatDateTime(value?: string | null) {
  if (!value) return null;

  try {
    return new Date(value).toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

/* ============================================================
   VALID TICKET
============================================================ */

function ValidTicketPage({
  ticket,
}: {
  ticket?: TicketData;
}) {
  return (
    <main className="min-h-screen bg-ink-950 px-4 py-10 text-cream sm:px-6">
      <div className="mx-auto flex min-h-[90vh] max-w-xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-[2rem] border border-emerald-400/20 bg-ink-900/70 shadow-2xl shadow-black/30">

          {/* ==================================================
              GREEN HEADER
          ================================================== */}

          <div className="bg-emerald-500 px-6 py-8 text-center text-ink-950">
            <CheckCircle2 className="mx-auto mb-4 h-16 w-16" />

            <p className="text-sm font-bold uppercase tracking-[0.3em]">
              Silo Camp
            </p>

            <h1 className="mt-2 text-4xl font-black uppercase">
              BILLET VALIDE
            </h1>

            <p className="mt-2 text-sm font-bold uppercase tracking-wider">
              ACCÈS AUTORISÉ
            </p>
          </div>

          {/* ==================================================
              CONTENT
          ================================================== */}

          <div className="px-6 py-8 sm:px-10">

            {/* Ticket number */}

            {ticket?.ticketNumber && (
              <div className="rounded-2xl border border-gold-400/20 bg-gold-400/5 p-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-300">
                  Numéro du billet
                </p>

                <p className="mt-2 break-all text-xl font-bold tracking-wider text-gold-300">
                  {ticket.ticketNumber}
                </p>
              </div>
            )}

            {/* Participant */}

            {ticket?.participantName && (
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-cream-dim">
                  Participant
                </p>

                <p className="mt-1 text-lg font-semibold text-cream">
                  {ticket.participantName}
                </p>
              </div>
            )}

            {/* Event */}

            {ticket?.eventTitle && (
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-cream-dim">
                  Événement
                </p>

                <p className="mt-1 font-medium text-cream">
                  {ticket.eventTitle}
                </p>
              </div>
            )}

            {/* Date / heure */}

            {(ticket?.dateLabel || ticket?.time) && (
              <div className="mt-5 grid grid-cols-2 gap-4">

                {ticket?.dateLabel && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-cream-dim">
                      Date
                    </p>

                    <p className="mt-1 font-medium text-cream">
                      {ticket.dateLabel}
                    </p>
                  </div>
                )}

                {ticket?.time && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-cream-dim">
                      Heure
                    </p>

                    <p className="mt-1 font-medium text-cream">
                      {ticket.time}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Venue */}

            {ticket?.venue && (
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-cream-dim">
                  Lieu
                </p>

                <p className="mt-1 font-medium text-cream">
                  {ticket.venue}
                  {ticket.city ? ` — ${ticket.city}` : ""}
                </p>
              </div>
            )}

            {/* Status */}

            <div className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />

              <p className="mt-3 text-lg font-black uppercase text-emerald-300">
                ACCÈS CONFIRMÉ
              </p>

              <p className="mt-2 text-sm leading-6 text-cream-dim">
                Ce billet est valide et peut être accepté à l'entrée.
              </p>
            </div>

            {/* Return */}

            <Link
              to="/"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold-400 px-6 py-4 text-sm font-semibold text-ink-950 transition hover:bg-gold-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ============================================================
   INVALID / USED / CANCELLED
============================================================ */

function InvalidTicketPage({
  state,
  message,
  ticket,
}: {
  state: Exclude<
    VerifyState,
    "loading" | "valid" | "missing-token"
  >;

  message?: string;

  ticket?: TicketData;
}) {
  const config = {
    used: {
      icon: AlertTriangle,
      label: "ATTENTION",
      title: "BILLET DÉJÀ UTILISÉ",

      text:
        message ||
        "Ce billet a déjà été contrôlé et utilisé. Il ne peut plus être présenté comme un accès valide.",

      iconClass: "text-amber-400",
      iconBg: "bg-amber-400/10",
      iconBorder: "border-amber-400/20",

      headerClass: "bg-amber-500",
      headerTextClass: "text-ink-950",

      statusClass:
        "border-amber-400/20 bg-amber-400/10 text-amber-300",
    },

    cancelled: {
      icon: XCircle,
      label: "ACCÈS REFUSÉ",
      title: "BILLET ANNULÉ",

      text:
        message ||
        "Ce billet a été annulé et ne permet plus l'accès au Camp International Silo 2026.",

      iconClass: "text-red-400",
      iconBg: "bg-red-400/10",
      iconBorder: "border-red-400/20",

      headerClass: "bg-red-500",
      headerTextClass: "text-white",

      statusClass:
        "border-red-400/20 bg-red-400/10 text-red-300",
    },

    "not-found": {
      icon: XCircle,
      label: "QR CODE",
      title: "QR CODE INVALIDE",

      text:
        message ||
        "Ce QR Code ne correspond à aucun billet enregistré dans SiloCamp.",

      iconClass: "text-red-400",
      iconBg: "bg-red-400/10",
      iconBorder: "border-red-400/20",

      headerClass: "bg-red-500",
      headerTextClass: "text-white",

      statusClass:
        "border-red-400/20 bg-red-400/10 text-red-300",
    },

    error: {
      icon: AlertTriangle,
      label: "VÉRIFICATION",
      title: "VÉRIFICATION IMPOSSIBLE",

      text:
        message ||
        "Une erreur est survenue pendant la vérification du billet. Veuillez réessayer.",

      iconClass: "text-amber-400",
      iconBg: "bg-amber-400/10",
      iconBorder: "border-amber-400/20",

      headerClass: "bg-amber-500",
      headerTextClass: "text-ink-950",

      statusClass:
        "border-amber-400/20 bg-amber-400/10 text-amber-300",
    },
  } as const;

  const current = config[state] ?? config.error;

  const Icon = current.icon;

  return (
    <main className="min-h-screen bg-ink-950 px-4 py-10 text-cream sm:px-6">
      <div className="mx-auto flex min-h-[90vh] max-w-xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-[2rem] border border-gold-400/10 bg-ink-900/70 shadow-2xl shadow-black/30">

          {/* ==================================================
              STATUS HEADER
          ================================================== */}

          <div
            className={`px-6 py-8 text-center ${current.headerClass} ${current.headerTextClass}`}
          >
            <Icon className="mx-auto mb-4 h-16 w-16" />

            <p className="text-sm font-bold uppercase tracking-[0.3em]">
              {current.label}
            </p>

            <h1 className="mt-2 text-3xl font-black uppercase sm:text-4xl">
              {current.title}
            </h1>
          </div>

          {/* ==================================================
              CONTENT
          ================================================== */}

          <div className="px-6 py-8 sm:px-10">

            <p className="mx-auto max-w-md text-center text-sm leading-7 text-cream-dim sm:text-base">
              {current.text}
            </p>

            {/* Ticket information */}

            {ticket?.ticketNumber && (
              <div className="mt-8 rounded-2xl border border-gold-400/20 bg-gold-400/5 p-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-300">
                  Numéro du billet
                </p>

                <p className="mt-2 break-all text-xl font-bold tracking-wider text-gold-300">
                  {ticket.ticketNumber}
                </p>
              </div>
            )}

            {ticket?.participantName && (
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-cream-dim">
                  Participant
                </p>

                <p className="mt-1 text-lg font-semibold text-cream">
                  {ticket.participantName}
                </p>
              </div>
            )}

            {/* Used date */}

            {state === "used" && ticket?.usedAt && (
              <div className="mt-5 rounded-xl border border-amber-400/10 bg-amber-400/5 p-4">
                <p className="text-xs uppercase tracking-wider text-cream-dim">
                  Billet utilisé le
                </p>

                <p className="mt-1 font-semibold text-amber-300">
                  {formatDateTime(ticket.usedAt)}
                </p>
              </div>
            )}

            {/* Cancelled date */}

            {state === "cancelled" && ticket?.cancelledAt && (
              <div className="mt-5 rounded-xl border border-red-400/10 bg-red-400/5 p-4">
                <p className="text-xs uppercase tracking-wider text-cream-dim">
                  Billet annulé le
                </p>

                <p className="mt-1 font-semibold text-red-300">
                  {formatDateTime(ticket.cancelledAt)}
                </p>
              </div>
            )}

            {/* Main status */}

            <div
              className={`mt-8 rounded-2xl border p-5 text-center ${current.statusClass}`}
            >
              <Icon className="mx-auto h-8 w-8" />

              <p className="mt-3 text-lg font-black uppercase">
                {state === "used"
                  ? "ACCÈS REFUSÉ"
                  : state === "cancelled"
                    ? "ACCÈS REFUSÉ"
                    : state === "not-found"
                      ? "BILLET NON RECONNU"
                      : "VÉRIFICATION IMPOSSIBLE"}
              </p>

              <p className="mt-2 text-sm leading-6 text-cream-dim">
                {state === "used"
                  ? "Ce billet ne peut plus être utilisé pour accéder à l'événement."
                  : state === "cancelled"
                    ? "Ce billet ne peut pas être accepté à l'entrée."
                    : state === "not-found"
                      ? "Aucun billet correspondant n'a été trouvé."
                      : "Veuillez effectuer une nouvelle tentative de vérification."}
              </p>
            </div>

            {/* Return */}

            <Link
              to="/"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold-400 px-6 py-4 text-sm font-semibold text-ink-950 transition hover:bg-gold-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ============================================================
   MISSING TOKEN
============================================================ */

function MissingTokenPage() {
  return (
    <main className="min-h-screen bg-ink-950 px-4 py-10 text-cream sm:px-6">
      <div className="mx-auto flex min-h-[90vh] max-w-xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-[2rem] border border-gold-400/10 bg-ink-900/70 shadow-2xl shadow-black/30">

          <div className="px-6 py-12 text-center sm:px-10">

            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-amber-400/20 bg-amber-400/10">
              <AlertTriangle
                className="h-10 w-10 text-amber-400"
                strokeWidth={1.8}
              />
            </div>

            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-gold-300">
              Vérification
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-cream sm:text-4xl">
              QR Code invalide
            </h1>

            <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-cream-dim sm:text-base">
              Aucun identifiant de vérification n'a été fourni avec ce QR
              Code ou ce lien.
            </p>

            <div className="mt-8 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-5">
              <AlertTriangle className="mx-auto h-7 w-7 text-amber-400" />

              <p className="mt-3 font-semibold text-amber-300">
                ACCÈS NON AUTORISÉ
              </p>

              <p className="mt-2 text-sm leading-6 text-cream-dim">
                Impossible de vérifier ce billet sans identifiant valide.
              </p>
            </div>

            <Link
              to="/"
              className="mt-9 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold-400 px-6 py-4 text-sm font-semibold text-ink-950 transition hover:bg-gold-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function TicketVerify() {
  const [state, setState] =
    useState<VerifyState>("loading");

  const [message, setMessage] = useState("");

  const [ticket, setTicket] =
    useState<TicketData | undefined>(undefined);

  async function checkTicket(token: string) {
    try {
      setState("loading");
      setMessage("");
      setTicket(undefined);

      const result =
        (await verifyTicket(token)) as VerifyResult;

      console.log(
        "[SiloCamp] Résultat de vérification :",
        result,
      );

      /*
       * On conserve les données du billet.
       */
      setTicket(result?.ticket);

      /*
       * --------------------------------------------------------
       * STATUS DU BILLET
       * --------------------------------------------------------
       *
       * On regarde à la fois :
       *
       * result.ticket.status
       * result.status
       * result.reason
       *
       * afin d'être compatible avec les différentes réponses
       * possibles de l'API.
       */

      const ticketStatus = normalizeStatus(
        result?.ticket?.status ?? result?.status,
      );

      const reason = normalizeReason(
        result?.reason,
      );

      /* ========================================================
         1. BILLET VALIDE
      ======================================================== */

      if (
        ticketStatus === "VALID" ||
        result?.valid === true
      ) {
        setState("valid");
        return;
      }

      /* ========================================================
         2. BILLET DÉJÀ UTILISÉ
      ======================================================== */

      if (
        ticketStatus === "USED" ||
        reason === "TICKET_ALREADY_USED" ||
        reason === "ALREADY_USED" ||
        reason === "USED"
      ) {
        setState("used");

        setMessage(
          result?.message ||
            "Ce billet a déjà été contrôlé et utilisé. Il ne peut plus être présenté comme un accès valide.",
        );

        return;
      }

      /* ========================================================
         3. BILLET ANNULÉ
      ======================================================== */

      if (
        ticketStatus === "CANCELLED" ||
        reason === "TICKET_CANCELLED" ||
        reason === "CANCELLED"
      ) {
        setState("cancelled");

        setMessage(
          result?.message ||
            "Ce billet a été annulé et ne permet plus l'accès au Camp International Silo 2026.",
        );

        return;
      }

      /* ========================================================
         4. QR CODE INCORRECT / BILLET INTROUVABLE
      ======================================================== */

      if (
        reason === "TICKET_NOT_FOUND" ||
        reason === "NOT_FOUND" ||
        reason === "INVALID_TOKEN" ||
        reason === "INVALID_QR" ||
        reason === "QR_INVALID" ||
        reason === "TOKEN_NOT_FOUND" ||
        result?.ok === false
      ) {
        setState("not-found");

        setMessage(
          result?.message ||
            "Ce QR Code ne correspond à aucun billet enregistré dans SiloCamp.",
        );

        return;
      }

      /* ========================================================
         5. RÉPONSE INCONNUE
      ======================================================== */

      setState("error");

      setMessage(
        result?.message ||
          "Le billet n'a pas pu être vérifié.",
      );
    } catch (error) {
      console.error(
        "[SiloCamp] Erreur de vérification du billet :",
        error,
      );

      setState("error");

      setMessage(
        "Une erreur est survenue pendant la vérification du billet. Veuillez réessayer.",
      );
    }
  }

  /* ============================================================
     GET TOKEN FROM URL
  ============================================================ */

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search,
    );

    const token = params
      .get("token")
      ?.trim();

    if (!token) {
      setState("missing-token");
      return;
    }

    void checkTicket(token);
  }, []);

  /* ============================================================
     LOADING
  ============================================================ */

  if (state === "loading") {
    return (
      <main className="min-h-screen bg-ink-950 px-4 py-10 text-cream sm:px-6">
        <div className="mx-auto flex min-h-[90vh] max-w-xl items-center justify-center">

          <div className="w-full overflow-hidden rounded-[2rem] border border-gold-400/10 bg-ink-900/70 px-6 py-14 text-center shadow-2xl shadow-black/20 sm:px-10">

            <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-full border border-gold-400/10 bg-gold-400/5">
              <RefreshCw className="h-7 w-7 animate-spin text-gold-300" />
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-300">
              Silo Camp
            </p>

            <h1 className="mt-4 text-2xl font-semibold text-cream">
              Vérification du billet
            </h1>

            <p className="mt-3 text-sm text-cream-dim">
              Vérification du QR Code en cours...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* ============================================================
     VALID
  ============================================================ */

  if (state === "valid") {
    return (
      <ValidTicketPage ticket={ticket} />
    );
  }

  /* ============================================================
     MISSING TOKEN
  ============================================================ */

  if (state === "missing-token") {
    return <MissingTokenPage />;
  }

  /* ============================================================
     USED / CANCELLED / NOT FOUND / ERROR
  ============================================================ */

  return (
    <InvalidTicketPage
      state={state}
      message={message}
      ticket={ticket}
    />
  );
}
