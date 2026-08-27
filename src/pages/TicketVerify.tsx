import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  QrCode,
  ShieldCheck,
  Ticket,
  User,
  XCircle,
} from "lucide-react";

import {
  getTicketByNumber,
  getTicketByVerificationToken,
  validateTicket,
  validateTicketByToken,
  useTicket,
  type Ticket as SiloTicket,
  type TicketValidationResult,
} from "@/services/ticketService";

type VerificationMode = "ticket" | "token";

type VerificationState =
  | "idle"
  | "loading"
  | "valid"
  | "used"
  | "cancelled"
  | "not-found"
  | "error";

export default function TicketVerify() {
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token")?.trim() || "";
  const ticketNumber =
    searchParams.get("ticket")?.trim() ||
    searchParams.get("ticketNumber")?.trim() ||
    "";

  const [ticket, setTicket] = useState<SiloTicket | null>(null);
  const [state, setState] = useState<VerificationState>("loading");
  const [message, setMessage] = useState("");
  const [validating, setValidating] = useState(false);

  const mode: VerificationMode = token ? "token" : "ticket";

  useEffect(() => {
    verifyTicket();
  }, [token, ticketNumber]);

  const verifyTicket = () => {
    setState("loading");
    setTicket(null);
    setMessage("");

    try {
      let result: TicketValidationResult;

      if (token) {
        result = validateTicketByToken(token);
      } else if (ticketNumber) {
        result = validateTicket(ticketNumber);
      } else {
        setState("not-found");
        setMessage(
          "Aucun numéro de billet ou token de vérification n'a été fourni.",
        );
        return;
      }

      if (result.valid) {
        setTicket(result.ticket);
        setState("valid");
        setMessage(result.message);
        return;
      }

      if (result.ticket) {
        setTicket(result.ticket);
      }

      if (result.reason === "USED") {
        setState("used");
        setMessage(result.message);
        return;
      }

      if (result.reason === "CANCELLED") {
        setState("cancelled");
        setMessage(result.message);
        return;
      }

      setState("not-found");
      setMessage(result.message);
    } catch (error) {
      console.error("[SiloCamp] Erreur de vérification :", error);

      setState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de la vérification du billet.",
      );
    }
  };

  const confirmEntry = () => {
    if (!ticket || validating || ticket.status !== "VALID") {
      return;
    }

    const confirmed = window.confirm(
      `Confirmer l'entrée de ${ticket.participantName} ?\n\nCette action marquera définitivement le billet comme utilisé.`,
    );

    if (!confirmed) {
      return;
    }

    setValidating(true);

    try {
      const result = useTicket(ticket.ticketNumber);

      if (!result.valid) {
        setTicket(result.ticket ?? ticket);

        if (result.reason === "USED") {
          setState("used");
        } else if (result.reason === "CANCELLED") {
          setState("cancelled");
        } else {
          setState("not-found");
        }

        setMessage(result.message);
        return;
      }

      setTicket(result.ticket);
      setState("used");
      setMessage(result.message);
    } catch (error) {
      console.error(
        "[SiloCamp] Erreur lors de la validation de l'entrée :",
        error,
      );

      setState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Impossible de valider l'entrée.",
      );
    } finally {
      setValidating(false);
    }
  };

  return (
    <main className="container-px mx-auto min-h-screen max-w-5xl py-28 md:py-32">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-gold-400/20 bg-gold-400/5 text-gold-300">
            <QrCode className="h-8 w-8" />
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-gold-300">
            SiloCamp 2026
          </p>

          <h1 className="mt-3 font-display text-4xl font-medium text-cream sm:text-5xl">
            Vérification du billet
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-cream-dim sm:text-base">
            Vérifiez l'authenticité et le statut du billet avant l'accès au
            Camp International Silo 2026.
          </p>
        </header>

        <div className="mb-8">
          <VerificationBanner state={state} message={message} />
        </div>

        {state === "loading" && <LoadingCard />}

        {(state === "valid" ||
          state === "used" ||
          state === "cancelled") &&
          ticket && (
            <TicketDetails
              ticket={ticket}
              state={state}
              mode={mode}
              validating={validating}
              onConfirmEntry={confirmEntry}
            />
          )}

        {(state === "not-found" || state === "error") && (
          <ErrorCard
            state={state}
            message={message}
            onRetry={verifyTicket}
          />
        )}

        <div className="mt-8 flex justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-gold-400/15 bg-ink-900/40 px-5 py-3 text-sm font-medium text-cream-dim transition hover:border-gold-400/30 hover:text-cream"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </main>
  );
}

function VerificationBanner({
  state,
  message,
}: {
  state: VerificationState;
  message: string;
}) {
  if (state === "loading") {
    return (
      <div className="rounded-3xl border border-gold-400/15 bg-gold-400/5 p-6">
        <div className="flex items-center justify-center gap-3 text-gold-300">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span className="text-sm font-medium">
            Vérification du billet...
          </span>
        </div>
      </div>
    );
  }

  if (state === "valid") {
    return (
      <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-6 text-center">
        <div className="flex items-center justify-center gap-3 text-emerald-300">
          <CheckCircle2 className="h-7 w-7" />
          <span className="font-display text-2xl font-medium">
            BILLET VALIDE
          </span>
        </div>

        <p className="mt-2 text-sm text-emerald-200/80">
          {message || "Ce billet peut être utilisé pour accéder à l'événement."}
        </p>
      </div>
    );
  }

  if (state === "used") {
    return (
      <div className="rounded-3xl border border-orange-400/30 bg-orange-400/10 p-6 text-center">
        <div className="flex items-center justify-center gap-3 text-orange-300">
          <ShieldCheck className="h-7 w-7" />
          <span className="font-display text-2xl font-medium">
            BILLET DÉJÀ UTILISÉ
          </span>
        </div>

        <p className="mt-2 text-sm text-orange-200/80">
          {message || "Ce billet a déjà été présenté à l'entrée."}
        </p>
      </div>
    );
  }

  if (state === "cancelled") {
    return (
      <div className="rounded-3xl border border-red-400/30 bg-red-400/10 p-6 text-center">
        <div className="flex items-center justify-center gap-3 text-red-300">
          <XCircle className="h-7 w-7" />
          <span className="font-display text-2xl font-medium">
            BILLET ANNULÉ
          </span>
        </div>

        <p className="mt-2 text-sm text-red-200/80">
          {message || "Ce billet n'est plus valable."}
        </p>
      </div>
    );
  }

  if (state === "not-found") {
    return (
      <div className="rounded-3xl border border-red-400/20 bg-red-400/5 p-6 text-center">
        <div className="flex items-center justify-center gap-3 text-red-300">
          <XCircle className="h-7 w-7" />
          <span className="font-display text-2xl font-medium">
            BILLET INTROUVABLE
          </span>
        </div>

        <p className="mt-2 text-sm text-cream-dim">
          {message || "Aucun billet correspondant n'a été trouvé."}
        </p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="rounded-3xl border border-red-400/20 bg-red-400/5 p-6 text-center">
        <div className="flex items-center justify-center gap-3 text-red-300">
          <XCircle className="h-7 w-7" />
          <span className="font-display text-2xl font-medium">
            ERREUR DE VÉRIFICATION
          </span>
        </div>

        <p className="mt-2 text-sm text-cream-dim">
          {message || "La vérification du billet a échoué."}
        </p>
      </div>
    );
  }

  return null;
}

function LoadingCard() {
  return (
    <div className="glass rounded-3xl p-8">
      <div className="animate-pulse space-y-5">
        <div className="mx-auto h-6 w-48 rounded-lg bg-cream/10" />
        <div className="mx-auto h-4 w-64 rounded-lg bg-cream/10" />
        <div className="h-px bg-cream/5" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-16 rounded-xl bg-cream/5" />
          <div className="h-16 rounded-xl bg-cream/5" />
          <div className="h-16 rounded-xl bg-cream/5" />
          <div className="h-16 rounded-xl bg-cream/5" />
        </div>
      </div>
    </div>
  );
}

function TicketDetails({
  ticket,
  state,
  mode,
  validating,
  onConfirmEntry,
}: {
  ticket: SiloTicket;
  state: VerificationState;
  mode: VerificationMode;
  validating: boolean;
  onConfirmEntry: () => void;
}) {
  const isValid = state === "valid";
  const isUsed = state === "used";
  const isCancelled = state === "cancelled";

  return (
    <div className="space-y-6">
      <div className="glass overflow-hidden rounded-3xl">
        <div className="border-b border-gold-400/10 bg-ink-950/30 p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cream-faint">
                Numéro du billet
              </p>

              <h2 className="mt-2 break-all font-mono text-xl font-semibold tracking-wide text-gold-300 sm:text-2xl">
                {ticket.ticketNumber}
              </h2>
            </div>

            <StatusBadge status={ticket.status} />
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoCard
              icon={<User className="h-5 w-5" />}
              label="Participant"
              value={ticket.participantName}
            />

            <InfoCard
              icon={<Ticket className="h-5 w-5" />}
              label="Billet"
              value="Participation gratuite"
            />

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
              value={`${ticket.venue}, ${ticket.city}`}
            />

            <InfoCard
              icon={<BadgeCheck className="h-5 w-5" />}
              label="Quantité"
              value={`${ticket.quantity} place`}
            />
          </div>

          <div className="mt-6 rounded-2xl border border-gold-400/10 bg-ink-950/40 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailRow
                label="Participant"
                value={ticket.participantName}
              />

              <DetailRow
                label="E-mail"
                value={ticket.email}
              />

              {ticket.phone && (
                <DetailRow
                  label="Téléphone"
                  value={ticket.phone}
                />
              )}

              {ticket.reservationId && (
                <DetailRow
                  label="Réservation"
                  value={ticket.reservationId}
                />
              )}

              <DetailRow
                label="Créé le"
                value={formatDate(ticket.createdAt)}
              />

              {ticket.usedAt && (
                <DetailRow
                  label="Utilisé le"
                  value={formatDate(ticket.usedAt)}
                />
              )}

              {ticket.cancelledAt && (
                <DetailRow
                  label="Annulé le"
                  value={formatDate(ticket.cancelledAt)}
                />
              )}

              <DetailRow
                label="Vérification"
                value={
                  mode === "token"
                    ? "Token QR Code"
                    : "Numéro de billet"
                }
              />
            </div>
          </div>
        </div>
      </div>

      {isValid && (
        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                  <ShieldCheck className="h-5 w-5" />
                </div>

                <h3 className="font-display text-xl text-cream">
                  Autoriser l'entrée
                </h3>
              </div>

              <p className="mt-3 max-w-xl text-sm leading-relaxed text-cream-dim">
                Le billet est valide. Après confirmation, il sera marqué comme
                utilisé et ne pourra plus être présenté une seconde fois.
              </p>
            </div>

            <button
              type="button"
              onClick={onConfirmEntry}
              disabled={validating}
              className="btn-gold flex shrink-0 items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {validating ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Validation...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Valider l'entrée
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {isUsed && (
        <div className="rounded-3xl border border-orange-400/20 bg-orange-400/5 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-300">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div>
              <h3 className="font-display text-xl text-cream">
                Accès déjà enregistré
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-cream-dim">
                Ce billet a déjà été utilisé. Il ne doit pas être accepté une
                seconde fois.
              </p>

              {ticket.usedAt && (
                <p className="mt-3 text-xs text-orange-300">
                  Entrée enregistrée le {formatDate(ticket.usedAt)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="rounded-3xl border border-red-400/20 bg-red-400/5 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-300">
              <XCircle className="h-5 w-5" />
            </div>

            <div>
              <h3 className="font-display text-xl text-cream">
                Accès refusé
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-cream-dim">
                Ce billet a été annulé et ne permet plus d'accéder à
                l'événement.
              </p>

              {ticket.cancelledAt && (
                <p className="mt-3 text-xs text-red-300">
                  Annulé le {formatDate(ticket.cancelledAt)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: SiloTicket["status"];
}) {
  if (status === "VALID") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-300">
        <CheckCircle2 className="h-4 w-4" />
        Valide
      </span>
    );
  }

  if (status === "USED") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-orange-500/15 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-orange-300">
        <ShieldCheck className="h-4 w-4" />
        Utilisé
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-red-500/15 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-red-300">
      <XCircle className="h-4 w-4" />
      Annulé
    </span>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gold-400/10 bg-ink-950/30 p-5">
      <div className="flex items-center gap-3 text-gold-300">
        {icon}

        <span className="text-xs font-medium uppercase tracking-wider text-cream-faint">
          {label}
        </span>
      </div>

      <p className="mt-3 text-sm font-medium leading-relaxed text-cream">
        {value}
      </p>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-cream-faint">
        {label}
      </p>

      <p className="mt-1 break-words text-sm text-cream">
        {value}
      </p>
    </div>
  );
}

function ErrorCard({
  state,
  message,
  onRetry,
}: {
  state: "not-found" | "error";
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="glass rounded-3xl p-8 text-center sm:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-red-400/20 bg-red-400/5 text-red-300">
        <Ticket className="h-8 w-8" />
      </div>

      <h2 className="mt-6 font-display text-2xl text-cream">
        {state === "not-found"
          ? "Impossible de vérifier ce billet"
          : "La vérification a échoué"}
      </h2>

      <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-cream-dim">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="btn-gold mt-7 inline-flex items-center justify-center gap-2"
      >
        Réessayer
      </button>
    </div>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

