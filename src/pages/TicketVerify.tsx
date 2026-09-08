"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  Phone,
  QrCode,
  ShieldCheck,
  Ticket as TicketIcon,
  UserRound,
  UsersRound,
  XCircle,
  AlertTriangle,
  Ban,
} from "lucide-react";

import {
  verifyTicket,
  type Ticket,
} from "@/services/ticketService";

type VerificationState =
  | "loading"
  | "valid"
  | "used"
  | "cancelled"
  | "not-found"
  | "error"
  | "missing-token";

type VerificationResult = {
  valid?: boolean;
  ticket?: Ticket | null;
  reason?: string;
  message?: string;
};

export default function TicketVerify() {
  const [state, setState] =
    useState<VerificationState>("loading");

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      try {
        const params = new URLSearchParams(
          window.location.search,
        );

        const token = params.get("token")?.trim();

        if (!token) {
          if (!cancelled) {
            setState("missing-token");
            setMessage(
              "Aucun jeton de vérification n'a été fourni.",
            );
          }
          return;
        }

        const result = (await verifyTicket(
          token,
        )) as VerificationResult;

        if (cancelled) return;

        if (result.valid && result.ticket) {
          setTicket(result.ticket);
          setState("valid");
          return;
        }

        const reason = String(
          result.reason ?? "",
        ).toUpperCase();

        if (
          reason === "TICKET_ALREADY_USED" ||
          reason === "USED" ||
          reason.includes("USED")
        ) {
          setTicket(result.ticket ?? null);
          setState("used");
          setMessage(
            result.message ||
              "Ce billet a déjà été utilisé à l'entrée.",
          );
          return;
        }

        if (
          reason === "TICKET_CANCELLED" ||
          reason === "CANCELLED" ||
          reason.includes("CANCEL")
        ) {
          setTicket(result.ticket ?? null);
          setState("cancelled");
          setMessage(
            result.message ||
              "Ce billet a été annulé et ne permet plus l'accès.",
          );
          return;
        }

        if (
          reason === "TICKET_NOT_FOUND" ||
          reason === "NOT_FOUND" ||
          reason.includes("NOT_FOUND")
        ) {
          setState("not-found");
          setMessage(
            result.message ||
              "Ce billet n'a pas été retrouvé.",
          );
          return;
        }

        setState("error");
        setMessage(
          result.message ||
            "Impossible de vérifier ce billet.",
        );
      } catch (error) {
        console.error(
          "[SiloCamp] Erreur de vérification :",
          error,
        );

        if (!cancelled) {
          setState("error");
          setMessage(
            "Une erreur est survenue pendant la vérification du billet.",
          );
        }
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return <LoadingPage />;
  }

  if (state === "valid" && ticket) {
    return <ValidTicketPage ticket={ticket} />;
  }

  if (state === "used") {
    return (
      <StatusPage
        icon={
          <Ban className="h-10 w-10" strokeWidth={2.2} />
        }
        title="Billet déjà utilisé"
        description={
          message ||
          "Ce billet a déjà été validé à l'entrée."
        }
        badge="BILLET DÉJÀ UTILISÉ"
        iconClassName="bg-amber-500/15 text-amber-300"
      />
    );
  }

  if (state === "cancelled") {
    return (
      <StatusPage
        icon={
          <XCircle
            className="h-10 w-10"
            strokeWidth={2.2}
          />
        }
        title="Billet annulé"
        description={
          message ||
          "Ce billet n'est plus valable pour accéder au Camp International Silo 2026."
        }
        badge="BILLET ANNULÉ"
        iconClassName="bg-red-500/15 text-red-300"
      />
    );
  }

  if (state === "not-found") {
    return (
      <StatusPage
        icon={
          <AlertTriangle
            className="h-10 w-10"
            strokeWidth={2.2}
          />
        }
        title="Billet introuvable"
        description={
          message ||
          "Le billet demandé n'existe pas ou le lien de vérification est incorrect."
        }
        badge="BILLET INTROUVABLE"
        iconClassName="bg-orange-500/15 text-orange-300"
      />
    );
  }

  if (state === "missing-token") {
    return (
      <StatusPage
        icon={
          <QrCode
            className="h-10 w-10"
            strokeWidth={2.2}
          />
        }
        title="Lien incomplet"
        description={
          message ||
          "Le lien de vérification ne contient pas les informations nécessaires."
        }
        badge="VÉRIFICATION IMPOSSIBLE"
        iconClassName="bg-yellow-500/15 text-yellow-300"
      />
    );
  }

  return (
    <StatusPage
      icon={
        <AlertTriangle
          className="h-10 w-10"
          strokeWidth={2.2}
        />
      }
      title="Vérification impossible"
      description={
        message ||
        "Nous n'avons pas pu vérifier l'authenticité de ce billet."
      }
      badge="ERREUR DE VÉRIFICATION"
      iconClassName="bg-red-500/15 text-red-300"
    />
  );
}

function LoadingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#160A06] via-[#3A1F14] to-[#120604] px-4 pb-12 pt-24 sm:px-6 sm:pb-16 sm:pt-28 lg:pt-32">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#D6B36A]/25 bg-[#2A160E]/80 shadow-2xl">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#D6B36A]/20 border-t-[#D6B36A]" />
          </div>

          <p className="mt-6 text-xs font-black uppercase tracking-[0.25em] text-[#D6B36A]">
            SiloCamp
          </p>

          <h1 className="mt-2 text-2xl font-black text-white">
            Vérification du billet
          </h1>

          <p className="mt-3 text-sm text-white/60">
            Authentification de votre accès en cours...
          </p>
        </div>
      </div>
    </main>
  );
}

function ValidTicketPage({
  ticket,
}: {
  ticket: Ticket;
}) {
  const childrenUnder12 = Math.max(
    0,
    Math.floor(Number(ticket.childrenUnder12 ?? 0)),
  );

  const children12Plus = Math.max(
    0,
    Math.floor(Number(ticket.children12Plus ?? 0)),
  );

  const totalChildren =
    childrenUnder12 + children12Plus;

  const participantName =
    ticket.participantName ||
    `${ticket.firstName ?? ""} ${ticket.lastName ?? ""}`.trim() ||
    "Participant";

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#160A06] via-[#3A1F14] to-[#120604] px-4 pb-12 pt-24 sm:px-6 sm:pb-16 sm:pt-28 lg:pt-32">
      <div className="mx-auto w-full max-w-5xl">
        <div className="overflow-hidden rounded-[2rem] border border-[#D6B36A]/20 bg-[#24130C]/95 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="relative overflow-hidden border-b border-[#D6B36A]/20 bg-gradient-to-r from-[#5A301D] via-[#3A1F14] to-[#211008] px-6 py-8 sm:px-10 sm:py-10">
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#D6B36A]/10 blur-3xl" />
            <div className="absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-[#8B4A2B]/20 blur-3xl" />

            <div className="relative">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D6B36A]/30 bg-[#D6B36A]/10">
                      <ShieldCheck
                        className="h-6 w-6 text-[#E7CA83]"
                        strokeWidth={2}
                      />
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#E7CA83]">
                        Vérification officielle
                      </p>

                      <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">
                        Votre accès est confirmé
                      </h1>
                    </div>
                  </div>

                  <p className="mt-5 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
                    Votre billet a été authentifié avec succès.
                    Vous êtes officiellement enregistré pour
                    participer au Camp International Silo 2026.
                  </p>
                </div>

                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  Accès confirmé
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-8 lg:p-10">
            <section>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D6B36A]/10 text-[#E7CA83]">
                  <UserRound
                    className="h-5 w-5"
                    strokeWidth={2}
                  />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#C99E75]">
                    Participant enregistré
                  </p>

                  <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">
                    {participantName}
                  </h2>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <TicketInfo
                  icon={
                    <Mail className="h-5 w-5" />
                  }
                  label="Email"
                  value={ticket.email}
                />

                <TicketInfo
                  icon={
                    <Phone className="h-5 w-5" />
                  }
                  label="Téléphone"
                  value={ticket.phone || "—"}
                />
              </div>
            </section>

            <div className="my-8 h-px bg-white/10" />

            <section>
              <div className="mb-5">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#C99E75]">
                  Informations du billet
                </p>

                <h2 className="mt-1 text-xl font-black text-white">
                  Détails de votre participation
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <TicketInfo
                  icon={
                    <CalendarDays className="h-5 w-5" />
                  }
                  label="Date"
                  value={ticket.dateLabel}
                />

                <TicketInfo
                  icon={
                    <Clock3 className="h-5 w-5" />
                  }
                  label="Heure"
                  value={ticket.time || "09h00"}
                />

                <TicketInfo
                  icon={
                    <Clock3 className="h-5 w-5" />
                  }
                  label="Durée"
                  value={ticket.duration || "9 heures"}
                />

                <TicketInfo
                  icon={
                    <MapPin className="h-5 w-5" />
                  }
                  label="Lieu"
                  value={
                    [ticket.venue, ticket.city]
                      .filter(Boolean)
                      .join(", ") ||
                    "Le Carré d'Or Casablanca"
                  }
                />

                <TicketInfo
                  icon={
                    <TicketIcon className="h-5 w-5" />
                  }
                  label="Billet"
                  value={ticket.ticketNumber}
                />

                <TicketInfo
                  icon={
                    <QrCode className="h-5 w-5" />
                  }
                  label="Statut"
                  value="Accès confirmé"
                />
              </div>
            </section>

            {totalChildren > 0 && (
              <>
                <div className="my-8 h-px bg-white/10" />

                <section>
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D6B36A]/10 text-[#E7CA83]">
                      <UsersRound
                        className="h-5 w-5"
                        strokeWidth={2}
                      />
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#C99E75]">
                        Accompagnants
                      </p>

                      <h2 className="mt-1 text-xl font-black text-white">
                        Enfants accompagnants
                      </h2>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {childrenUnder12 > 0 && (
                      <TicketInfo
                        icon={
                          <UsersRound className="h-5 w-5" />
                        }
                        label="Moins de 12 ans"
                        value={`${childrenUnder12} ${
                          childrenUnder12 > 1
                            ? "enfants"
                            : "enfant"
                        }`}
                      />
                    )}

                    {children12Plus > 0 && (
                      <TicketInfo
                        icon={
                          <UsersRound className="h-5 w-5" />
                        }
                        label="12 ans ou plus"
                        value={`${children12Plus} ${
                          children12Plus > 1
                            ? "enfants"
                            : "enfant"
                        }`}
                      />
                    )}

                    <TicketInfo
                      icon={
                        <UsersRound className="h-5 w-5" />
                      }
                      label="Total enfants"
                      value={`${totalChildren} ${
                        totalChildren > 1
                          ? "enfants"
                          : "enfant"
                      }`}
                    />
                  </div>
                </section>
              </>
            )}

            <div className="my-8 h-px bg-white/10" />

            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                  <CheckCircle2
                    className="h-6 w-6"
                    strokeWidth={2.2}
                  />
                </div>

                <div>
                  <p className="text-sm font-black text-emerald-300">
                    Billet authentifié
                  </p>

                  <p className="mt-1 text-sm leading-6 text-white/60">
                    Ce billet est enregistré dans le système
                    SiloCamp et peut être présenté à l'entrée
                    du Camp International Silo 2026.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <Link
                to="/"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D6B36A] px-6 py-3.5 text-sm font-black text-[#211008] shadow-lg shadow-black/20 transition hover:bg-[#E7CA83] sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour à l'accueil
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-white/35">
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
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D6B36A]/10 text-[#E7CA83]">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#C99E75]">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-bold text-white">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function StatusPage({
  icon,
  title,
  description,
  badge,
  iconClassName,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  badge: string;
  iconClassName: string;
}) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#160A06] via-[#3A1F14] to-[#120604] px-4 pb-12 pt-24 sm:px-6 sm:pb-16 sm:pt-28 lg:pt-32">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-[2rem] border border-[#D6B36A]/20 bg-[#24130C]/95 shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
          <div className="h-2 bg-gradient-to-r from-[#D6B36A] via-[#9A623E] to-[#D6B36A]" />

          <div className="p-7 text-center sm:p-10">
            <div
              className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-white/10 ${iconClassName}`}
            >
              {icon}
            </div>

            <p className="mt-7 text-[10px] font-black uppercase tracking-[0.22em] text-[#D6B36A]">
              {badge}
            </p>

            <h1 className="mt-3 text-3xl font-black text-white">
              {title}
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/60 sm:text-base">
              {description}
            </p>

            <Link
              to="/"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D6B36A] px-6 py-3.5 text-sm font-black text-[#211008] transition hover:bg-[#E7CA83] sm:w-auto"
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