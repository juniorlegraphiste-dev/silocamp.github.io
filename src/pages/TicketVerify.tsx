import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Home,
  Loader2,
  MapPin,
  ShieldCheck,
  Ticket as TicketIcon,
  XCircle,
} from "lucide-react";

import { verifyTicket, type Ticket } from "@/services/ticketService";

type VerificationState =
  | "loading"
  | "valid"
  | "used"
  | "cancelled"
  | "not-found"
  | "error"
  | "missing-token";

export default function TicketVerify() {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [state, setState] = useState<VerificationState>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token")?.trim();

      if (!token) {
        if (!cancelled) {
          setState("missing-token");
          setMessage("Aucun lien de vérification valide n'a été fourni.");
        }
        return;
      }

      try {
        const result = await verifyTicket(token);

        if (cancelled) return;

        if (result.ticket) {
          setTicket(result.ticket);
        }

        if (result.valid && result.ticket) {
          setState("valid");
          return;
        }

        setState("error");

        setMessage(result.message || "Impossible de vérifier ce billet.");
      } catch (error) {
        if (cancelled) return;

        console.error("[SiloCamp TicketVerify]", error);

        setState("error");

        setMessage(
          error instanceof Error
            ? error.message
            : "Impossible de vérifier le billet.",
        );
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return <LoadingScreen />;
  }

  if (state === "error" || state === "missing-token") {
    return (
      <StatusPage
        type="error"
        title="Vérification impossible"
        message={message}
      />
    );
  }

  if (state === "not-found") {
    return (
      <StatusPage
        type="invalid"
        title="Billet introuvable"
        message={
          message ||
          "Ce billet ne correspond à aucun billet enregistré dans le système SiloCamp."
        }
      />
    );
  }

  if (!ticket) {
    return (
      <StatusPage
        type="invalid"
        title="Billet non valide"
        message="Les informations du billet n'ont pas pu être récupérées."
      />
    );
  }

  const participantName =
    ticket.participantName ||
    [ticket.firstName, ticket.lastName].filter(Boolean).join(" ") ||
    "Participant";

  if (state === "valid") {
    return <ValidTicketPage ticket={ticket} />;
  }

  if (state === "used") {
    return (
      <UsedTicketPage
        ticket={ticket}
        participantName={participantName}
        message={message}
      />
    );
  }

  return (
    <CancelledTicketPage
      ticket={ticket}
      participantName={participantName}
      message={message}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* LOADING                                                                     */
/* -------------------------------------------------------------------------- */

function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#10081f] px-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#d6b36a]/20 bg-[#d6b36a]/10">
          <Loader2 className="h-9 w-9 animate-spin text-[#d6b36a]" />
        </div>

        <h1 className="mt-7 font-display text-3xl font-semibold text-white">
          Vérification du billet
        </h1>

        <p className="mt-3 text-sm leading-6 text-white/55">
          Nous vérifions votre billet auprès du système officiel SiloCamp...
        </p>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* VALID TICKET                                                                */
/* -------------------------------------------------------------------------- */

type ValidTicketPageProps = {
  ticket: Ticket;
};

function ValidTicketPage({ ticket }: ValidTicketPageProps) {
  const totalChildren =
    (ticket.childrenUnder12 ?? 0) + (ticket.children12Plus ?? 0);

  const participantName =
    ticket.participantName ||
    `${ticket.firstName ?? ""} ${ticket.lastName ?? ""}`.trim() ||
    "Participant";

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#160525] via-[#2b0d4d] to-[#12031f] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        {/* Badge */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300 backdrop-blur">
            <CheckCircle2 className="h-5 w-5" />
            Billet authentifié
          </div>
        </div>

        {/* Carte principale */}
        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[#2a1044] shadow-2xl shadow-black/40">
          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#4c1678] via-[#321052] to-[#1b082d] px-6 py-10 text-center sm:px-10">
            {/* Effet décoratif */}
            <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-[#d6b36a]/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-violet-400/10 blur-3xl" />

            <div className="relative">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="h-11 w-11 text-white" />
              </div>

              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d6b36a]/30 bg-[#d6b36a]/10 px-4 py-2">
                <ShieldCheck className="h-4 w-4 text-[#e7ca83]" />

                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#e7ca83]">
                  Vérification officielle
                </span>
              </div>

              <h1 className="text-3xl font-black text-white sm:text-4xl">
                Votre accès est confirmé
              </h1>

              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-violet-100 sm:text-base">
                Votre billet a été authentifié avec succès. Vous êtes
                officiellement enregistré pour participer au Camp International
                Silo 2026.
              </p>
            </div>
          </div>

          {/* Contenu */}
          <div className="space-y-6 p-5 sm:p-8">
            {/* Participant */}
            <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#d6b36a]/15">
                  <BadgeCheck className="h-6 w-6 text-[#e7ca83]" />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-300">
                    Participant enregistré
                  </p>

                  <p className="mt-2 break-words text-xl font-black text-white">
                    {participantName}
                  </p>

                  {ticket.email && (
                    <p className="mt-2 break-all text-sm text-white/60">
                      {ticket.email}
                    </p>
                  )}

                  {ticket.phone && (
                    <p className="mt-1 text-sm text-white/60">{ticket.phone}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Informations */}
            <section>
              <div className="mb-4 flex items-center gap-3">
                <div className="h-8 w-1 rounded-full bg-[#d6b36a]" />

                <div>
                  <p className="text-lg font-black text-white">
                    Informations du billet
                  </p>

                  <p className="text-xs text-white/45">
                    Détails de votre participation
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TicketInfo
                  icon={<CalendarDays className="h-5 w-5" />}
                  label="Date"
                  value={ticket.dateLabel}
                />

                <TicketInfo
                  icon={<Clock3 className="h-5 w-5" />}
                  label="Heure"
                  value={ticket.time}
                />

                <TicketInfo
                  icon={<MapPin className="h-5 w-5" />}
                  label="Lieu"
                  value={`${ticket.venue}, ${ticket.city}`}
                />

                <TicketInfo
                  icon={<TicketIcon className="h-5 w-5" />}
                  label="Numéro du billet"
                  value={ticket.ticketNumber}
                />
              </div>
            </section>

            {/* Réservation */}
            {ticket.reservationId && (
              <section className="rounded-3xl border border-[#d6b36a]/20 bg-[#d6b36a]/5 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#e7ca83]">
                  Numéro de réservation
                </p>

                <p className="mt-3 break-all font-mono text-sm font-bold text-white">
                  {ticket.reservationId}
                </p>
              </section>
            )}

            {/* Enfants */}
            {totalChildren > 0 && (
              <section className="rounded-3xl border border-amber-400/20 bg-amber-400/5 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">
                      Accompagnants
                    </p>

                    <div className="mt-2 text-sm font-semibold text-white">
                      {ticket.childrenUnder12 > 0 && (
                        <p>
                          {ticket.childrenUnder12} enfant
                          {ticket.childrenUnder12 > 1 ? "s" : ""} de moins de 12
                          ans
                        </p>
                      )}

                      {ticket.children12Plus > 0 && (
                        <p>
                          {ticket.children12Plus} enfant
                          {ticket.children12Plus > 1 ? "s" : ""} de 12 ans ou
                          plus
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-xl font-black text-amber-300">
                    {totalChildren}
                  </div>
                </div>
              </section>
            )}

            {/* Statut final */}
            <div className="rounded-3xl border border-emerald-400/20 bg-gradient-to-r from-emerald-500/15 to-emerald-400/5 p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                  <CheckCircle2 className="h-7 w-7 text-white" />
                </div>

                <div>
                  <p className="text-lg font-black text-white">
                    Accès autorisé
                  </p>

                  <p className="mt-1 text-sm text-emerald-200">
                    Ce billet est authentique et valide pour l'entrée au Camp.
                  </p>
                </div>
              </div>
            </div>

            <HomeButton />
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 bg-black/10 px-6 py-5 text-center">
            <p className="text-xs font-semibold text-white/40">
              SILOCAMP • CAMP INTERNATIONAL SILO 2026
            </p>

            <p className="mt-1 text-[10px] text-white/25">
              Billetterie officielle sécurisée
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* USED TICKET                                                                 */
/* -------------------------------------------------------------------------- */

function UsedTicketPage({
  ticket,
  participantName,
  message,
}: {
  ticket: Ticket;
  participantName: string;
  message: string;
}) {
  return (
    <main className="min-h-screen bg-[#10081f] px-4 py-10 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-xl flex-col justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-amber-400/20 bg-amber-400/10">
            <Clock3 className="h-10 w-10 text-amber-400" />
          </div>

          <h1 className="mt-7 font-display text-4xl font-semibold text-white">
            Billet déjà utilisé
          </h1>

          <p className="mt-4 text-sm leading-6 text-white/60">{message}</p>
        </div>

        <StatusTicketCard
          ticket={ticket}
          participantName={participantName}
          status="used"
        />

        <HomeButton />
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* CANCELLED TICKET                                                            */
/* -------------------------------------------------------------------------- */

function CancelledTicketPage({
  ticket,
  participantName,
  message,
}: {
  ticket: Ticket;
  participantName: string;
  message: string;
}) {
  return (
    <main className="min-h-screen bg-[#10081f] px-4 py-10 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-xl flex-col justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-red-400/20 bg-red-400/10">
            <XCircle className="h-10 w-10 text-red-400" />
          </div>

          <h1 className="mt-7 font-display text-4xl font-semibold text-white">
            Billet annulé
          </h1>

          <p className="mt-4 text-sm leading-6 text-white/60">{message}</p>
        </div>

        <StatusTicketCard
          ticket={ticket}
          participantName={participantName}
          status="cancelled"
        />

        <HomeButton />
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* STATUS TICKET CARD                                                         */
/* -------------------------------------------------------------------------- */

function StatusTicketCard({
  ticket,
  participantName,
  status,
}: {
  ticket: Ticket;
  participantName: string;
  status: "used" | "cancelled";
}) {
  const isUsed = status === "used";

  return (
    <div className="mt-9 overflow-hidden rounded-[30px] bg-white shadow-2xl">
      <div className={`px-6 py-6 ${isUsed ? "bg-amber-500" : "bg-red-500"}`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
              Numéro du billet
            </p>

            <p className="mt-1 break-all font-mono text-sm font-black text-white">
              {ticket.ticketNumber}
            </p>
          </div>

          {isUsed ? (
            <Clock3 className="h-8 w-8 shrink-0 text-white" />
          ) : (
            <XCircle className="h-8 w-8 shrink-0 text-white" />
          )}
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Participant
        </p>

        <p className="mt-2 text-xl font-black text-slate-900">
          {participantName}
        </p>

        <div className="mt-7 grid gap-4">
          <TicketInfo
            icon={<TicketIcon className="h-4 w-4" />}
            label="Événement"
            value={ticket.eventTitle}
          />

          <TicketInfo
            icon={<CalendarDays className="h-4 w-4" />}
            label="Date"
            value={ticket.dateLabel}
          />

          <TicketInfo
            icon={<Clock3 className="h-4 w-4" />}
            label="Heure"
            value={ticket.time}
          />

          <TicketInfo
            icon={<MapPin className="h-4 w-4" />}
            label="Lieu"
            value={`${ticket.venue}${ticket.city ? `, ${ticket.city}` : ""}`}
          />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* STATUS PAGE                                                                 */
/* -------------------------------------------------------------------------- */

function StatusPage({
  type,
  title,
  message,
}: {
  type: "error" | "invalid";
  title: string;
  message: string;
}) {
  const isError = type === "error";

  return (
    <main className="min-h-screen bg-[#10081f] px-4 py-10 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-lg flex-col justify-center">
        {/* Marque */}
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#d6b36a]/20 bg-[#d6b36a]/10 shadow-[0_0_50px_rgba(214,179,106,0.08)]">
            <TicketIcon className="h-9 w-9 text-[#d6b36a]" />
          </div>

          <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-[#d6b36a]/20 bg-[#d6b36a]/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#d6b36a]">
            <ShieldCheck className="h-4 w-4" />
            SiloCamp
          </div>

          <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {isError ? "Vérification impossible" : "Billet introuvable"}
          </h1>

          <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-white/60 sm:text-base">
            {isError
              ? "Nous n'avons pas pu effectuer la vérification de votre billet pour le moment."
              : "Ce lien ne correspond à aucun billet enregistré dans le système SiloCamp."}
          </p>
        </div>

        {/* Carte */}
        <div className="mt-9 overflow-hidden rounded-[30px] border border-white/10 bg-white shadow-2xl shadow-black/30">
          <div className="bg-gradient-to-r from-[#24123e] to-[#160b29] px-6 py-7 text-center sm:px-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d6b36a]/20 bg-[#d6b36a]/10">
              {isError ? (
                <AlertTriangle className="h-7 w-7 text-[#d6b36a]" />
              ) : (
                <XCircle className="h-7 w-7 text-red-400" />
              )}
            </div>

            <p className="mt-5 text-[10px] font-black uppercase tracking-[0.25em] text-[#d6b36a]">
              Billetterie officielle
            </p>

            <h2 className="mt-2 text-xl font-black text-white">
              {isError
                ? "Vérification temporairement indisponible"
                : "Aucun billet trouvé"}
            </h2>
          </div>

          {/* Contenu */}
          <div className="p-6 sm:p-8">
            <div
              className={`rounded-2xl border p-5 ${
                isError
                  ? "border-amber-200 bg-amber-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    isError ? "bg-amber-100" : "bg-red-100"
                  }`}
                >
                  {isError ? (
                    <ShieldCheck className="h-5 w-5 text-amber-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>

                <div>
                  <p
                    className={`text-sm font-black ${
                      isError ? "text-amber-800" : "text-red-800"
                    }`}
                  >
                    {isError
                      ? "Vérification non disponible"
                      : "Billet introuvable"}
                  </p>

                  <p
                    className={`mt-2 text-xs leading-6 ${
                      isError ? "text-amber-700" : "text-red-700"
                    }`}
                  >
                    {isError
                      ? "Le système de vérification rencontre actuellement un problème technique. Veuillez réessayer dans quelques instants."
                      : "Vérifiez que vous utilisez bien le lien reçu dans votre e-mail de confirmation."}
                  </p>
                </div>
              </div>
            </div>

            {/* Message serveur */}
            {message && !message.toLowerCase().includes("authentification") && (
              <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs leading-6 text-slate-500">{message}</p>
              </div>
            )}

            {/* Information */}
            <div className="mt-7">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f4efe6]">
                  <TicketIcon className="h-4 w-4 text-[#8d6c2d]" />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    À savoir
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Conservez votre billet et son QR Code. Ils pourront être
                    demandés à votre arrivée au Camp.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 bg-slate-50 px-6 py-5 text-center">
            <p className="text-xs font-medium text-slate-400">
              SiloCamp • Billetterie officielle
            </p>

            <p className="mt-1 text-[11px] text-slate-300">
              Votre billet reste associé à votre réservation
            </p>
          </div>
        </div>

        <Link
          to="/"
          className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#d6b36a] px-6 py-4 text-sm font-black text-[#160b29] shadow-lg shadow-[#d6b36a]/10 transition hover:-translate-y-0.5 hover:bg-[#e2c47e]"
        >
          <Home className="h-5 w-5" />
          Retour à l'accueil
        </Link>

        <p className="mt-5 text-center text-[11px] leading-5 text-white/30">
          SiloCamp • Camp International Silo 2026
        </p>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* TICKET INFO                                                                 */
/* -------------------------------------------------------------------------- */

function TicketInfo({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f4efe6] text-[#8d6c2d]">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-bold text-slate-800">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* HOME BUTTON                                                                 */
/* -------------------------------------------------------------------------- */

function HomeButton() {
  return (
    <Link
      to="/"
      className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#d6b36a] px-6 py-4 text-sm font-black text-[#160b29] shadow-lg shadow-[#d6b36a]/10 transition hover:-translate-y-0.5 hover:bg-[#e2c47e]"
    >
      <Home className="h-5 w-5" />
      Retour à l'accueil
    </Link>
  );
}
