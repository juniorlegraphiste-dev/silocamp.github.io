import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
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

        if (cancelled) {
          return;
        }

        if (result.ticket) {
          setTicket(result.ticket);
        }

        if (result.valid) {
          setState("valid");
          setMessage(result.message || "Votre billet est valide.");
          return;
        }

        switch (result.reason) {
          case "TICKET_ALREADY_USED":
          case "USED":
            setState("used");
            setMessage(result.message || "Ce billet a déjà été utilisé.");
            break;

          case "TICKET_CANCELLED":
          case "CANCELLED":
            setState("cancelled");
            setMessage(result.message || "Ce billet a été annulé.");
            break;

          case "TICKET_NOT_FOUND":
          case "NOT_FOUND":
            setState("not-found");
            setMessage(result.message || "Billet introuvable.");
            break;

          default:
            setState("error");
            setMessage(result.message || "Impossible de vérifier ce billet.");
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("[SiloCamp TicketVerify]", error);

        setState("error");

        setMessage(
          error instanceof Error
            ? error.message
            : "Impossible de contacter le serveur SiloCamp.",
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
    return (
      <ValidTicketPage ticket={ticket} participantName={participantName} />
    );
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

function ValidTicketPage({
  ticket,
  participantName,
}: {
  ticket: Ticket;
  participantName: string;
}) {
  return (
    <main className="min-h-screen bg-[#10081f] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-xl flex-col justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 shadow-[0_0_50px_rgba(16,185,129,0.12)]">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          </div>

          <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-[#d6b36a]/20 bg-[#d6b36a]/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#d6b36a]">
            <ShieldCheck className="h-4 w-4" />
            Vérification officielle
          </div>

          <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Votre billet est <span className="text-[#d6b36a]">valide</span>
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-white/60 sm:text-base">
            Bonjour{" "}
            <span className="font-semibold text-white">{participantName}</span>.
            Votre billet a été vérifié avec succès.
          </p>
        </div>

        <div className="mt-9 overflow-hidden rounded-[30px] border border-white/10 bg-white shadow-2xl shadow-black/30">
          <div className="bg-gradient-to-r from-[#24123e] to-[#160b29] px-6 py-7 text-white sm:px-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#d6b36a]/20 bg-[#d6b36a]/10">
                <TicketIcon className="h-6 w-6 text-[#d6b36a]" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">
                  Billet SiloCamp
                </p>

                <p className="mt-1 break-all font-mono text-sm font-bold text-[#d6b36a]">
                  {ticket.ticketNumber}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>

                <div>
                  <p className="text-sm font-black text-emerald-800">
                    Accès confirmé
                  </p>

                  <p className="mt-1 text-xs leading-5 text-emerald-700">
                    Ce billet est actuellement valide et peut être présenté à
                    l'entrée du Camp.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-7">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Participant
              </p>

              <p className="mt-2 text-xl font-black text-slate-900">
                {participantName}
              </p>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
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
                value={`${ticket.venue}, ${ticket.city}`}
              />
            </div>

            {ticket.reservationId && (
              <div className="mt-7 rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Réservation
                </p>

                <p className="mt-2 break-all font-mono text-sm font-bold text-slate-800">
                  {ticket.reservationId}
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 bg-slate-50 px-6 py-5 text-center">
            <p className="text-xs font-medium text-slate-400">
              SiloCamp • Billetterie officielle
            </p>

            <p className="mt-1 text-[11px] text-slate-300">
              Vérification sécurisée de votre billet
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
          Présentez votre billet et son QR Code lors de votre arrivée au Camp.
        </p>
      </div>
    </main>
  );
}

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
            icon={<MapPin className="h-4 w-4" />}
            label="Lieu"
            value={`${ticket.venue}, ${ticket.city}`}
          />
        </div>
      </div>
    </div>
  );
}

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
        {/* Logo / marque */}
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#d6b36a]/20 bg-[#d6b36a]/10 shadow-[0_0_50px_rgba(214,179,106,0.08)]">
            <TicketIcon className="h-9 w-9 text-[#d6b36a]" />
          </div>

          <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-[#d6b36a]/20 bg-[#d6b36a]/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#d6b36a]">
            <ShieldCheck className="h-4 w-4" />
            SiloCamp
          </div>

          <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {isError ? "Vérification du billet" : "Billet introuvable"}
          </h1>

          <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-white/60 sm:text-base">
            {isError
              ? "Nous n'avons pas pu effectuer la vérification de votre billet pour le moment."
              : "Ce lien ne correspond à aucun billet enregistré dans le système SiloCamp."}
          </p>
        </div>

        {/* Carte principale */}
        <div className="mt-9 overflow-hidden rounded-[30px] border border-white/10 bg-white shadow-2xl shadow-black/30">
          {/* Header */}
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
                      ? "Votre billet n'est pas déclaré invalide"
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

            {/* Message technique masqué visuellement */}
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

        {/* Retour */}
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
