"use client";

import { useEffect, useState } from "react";

import {
  CheckCircle2,
  XCircle,
  Clock3,
  Ticket as TicketIcon,
  User,
  Mail,
  Phone,
  CalendarDays,
  MapPin,
  Hash,
  Loader2,
  AlertTriangle,
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

export default function TicketVerify() {
  const [ticket, setTicket] =
    useState<Ticket | null>(null);

  const [state, setState] =
    useState<VerificationState>("loading");

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      const params = new URLSearchParams(
        window.location.search,
      );

      const token = params.get("token")?.trim();

      if (!token) {
        if (!cancelled) {
          setState("missing-token");
          setMessage(
            "Aucun token de vérification n'a été fourni.",
          );
        }

        return;
      }

      try {
        const result =
          await verifyTicket(token);

        if (cancelled) {
          return;
        }

        if (result.ticket) {
          setTicket(result.ticket);
        }

        if (result.valid) {
          setState("valid");
          setMessage(
            result.message ||
              "Billet valide.",
          );

          return;
        }

        switch (result.reason) {
          case "USED":
            setState("used");
            setMessage(
              result.message ||
                "Ce billet a déjà été utilisé.",
            );
            break;

          case "CANCELLED":
            setState("cancelled");
            setMessage(
              result.message ||
                "Ce billet a été annulé.",
            );
            break;

          case "NOT_FOUND":
            setState("not-found");
            setMessage(
              result.message ||
                "Billet introuvable.",
            );
            break;

          default:
            setState("error");
            setMessage(
              result.message ||
                "Impossible de vérifier ce billet.",
            );
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "[TicketVerify]",
          error,
        );

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

  /* =========================================================
     LOADING
     ========================================================= */

  if (state === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
        <div className="text-center text-white">
          <Loader2 className="mx-auto mb-5 h-12 w-12 animate-spin" />

          <h1 className="text-xl font-bold">
            Vérification du billet
          </h1>

          <p className="mt-2 text-sm text-white/60">
            Connexion au système SiloCamp...
          </p>
        </div>
      </main>
    );
  }

  /* =========================================================
     ERREUR / TOKEN MANQUANT
     ========================================================= */

  if (
    state === "error" ||
    state === "missing-token"
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
        <div className="w-full max-w-md rounded-[28px] bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-9 w-9 text-red-600" />
          </div>

          <h1 className="text-2xl font-black text-slate-900">
            Erreur de vérification
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {message}
          </p>

          <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            VÉRIFICATION IMPOSSIBLE
          </div>
        </div>
      </main>
    );
  }

  /* =========================================================
     BILLET INTROUVABLE
     ========================================================= */

  if (
    state === "not-found" ||
    !ticket
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
        <div className="w-full max-w-md rounded-[28px] bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-9 w-9 text-red-600" />
          </div>

          <h1 className="text-2xl font-black text-slate-900">
            Billet introuvable
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Ce QR Code ne correspond à aucun
            billet enregistré dans la base de
            données SiloCamp.
          </p>

          <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            BILLET NON VALIDE
          </div>
        </div>
      </main>
    );
  }

  const isValid =
    state === "valid";

  const isUsed =
    state === "used";

  const isCancelled =
    state === "cancelled";

  /* =========================================================
     STATUS
     ========================================================= */

  const statusTitle = isValid
    ? "BILLET VALIDE"
    : isUsed
      ? "BILLET DÉJÀ UTILISÉ"
      : isCancelled
        ? "BILLET ANNULÉ"
        : "BILLET NON VALIDE";

  const statusMessage = isValid
    ? "Ce billet est enregistré et peut être présenté à l'entrée."
    : isUsed
      ? "Ce billet a déjà été utilisé."
      : isCancelled
        ? "Ce billet a été annulé."
        : message;

  const statusClass = isValid
    ? "bg-emerald-500"
    : isUsed
      ? "bg-amber-500"
      : "bg-red-500";

  /* =========================================================
     PAGE
     ========================================================= */

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-lg">
        {/* HEADER */}

        <div className="mb-6 text-center text-white">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <TicketIcon className="h-7 w-7" />
          </div>

          <h1 className="text-3xl font-black">
            SiloCamp
          </h1>

          <p className="mt-1 text-sm text-white/60">
            Vérification officielle du billet
          </p>
        </div>

        {/* TICKET */}

        <div className="overflow-hidden rounded-[30px] bg-white shadow-2xl">
          {/* STATUS */}

          <div
            className={`px-6 py-8 text-center ${statusClass}`}
          >
            {isValid ? (
              <CheckCircle2 className="mx-auto h-14 w-14 text-white" />
            ) : isUsed ? (
              <Clock3 className="mx-auto h-14 w-14 text-white" />
            ) : (
              <XCircle className="mx-auto h-14 w-14 text-white" />
            )}

            <h2 className="mt-4 text-2xl font-black text-white">
              {statusTitle}
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/85">
              {statusMessage}
            </p>
          </div>

          {/* CONTENT */}

          <div className="p-6">
            {/* NUMÉRO */}

            <div className="mb-7 rounded-2xl bg-slate-50 p-5 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Numéro du billet
              </p>

              <p className="mt-2 break-all text-xl font-black tracking-wide text-slate-900">
                {ticket.ticketNumber}
              </p>
            </div>

            {/* PARTICIPANT */}

            <section>
              <SectionTitle>
                Participant
              </SectionTitle>

              <div className="space-y-4">
                <InfoRow
                  icon={
                    <User className="h-4 w-4" />
                  }
                  label="Prénom"
                  value={
                    ticket.firstName || "—"
                  }
                />

                <InfoRow
                  icon={
                    <User className="h-4 w-4" />
                  }
                  label="Nom"
                  value={
                    ticket.lastName || "—"
                  }
                />

                <InfoRow
                  icon={
                    <Phone className="h-4 w-4" />
                  }
                  label="Téléphone"
                  value={
                    ticket.phone || "—"
                  }
                />

                <InfoRow
                  icon={
                    <Mail className="h-4 w-4" />
                  }
                  label="E-mail"
                  value={
                    ticket.email || "—"
                  }
                />
              </div>
            </section>

            {/* ÉVÉNEMENT */}

            <section className="mt-8">
              <SectionTitle>
                Événement
              </SectionTitle>

              <div className="space-y-4">
                <InfoRow
                  icon={
                    <TicketIcon className="h-4 w-4" />
                  }
                  label="Événement"
                  value={
                    ticket.eventTitle
                  }
                />

                <InfoRow
                  icon={
                    <CalendarDays className="h-4 w-4" />
                  }
                  label="Date"
                  value={
                    ticket.dateLabel
                  }
                />

                <InfoRow
                  icon={
                    <Clock3 className="h-4 w-4" />
                  }
                  label="Heure"
                  value={ticket.time}
                />

                <InfoRow
                  icon={
                    <MapPin className="h-4 w-4" />
                  }
                  label="Lieu"
                  value={`${ticket.venue}, ${ticket.city}`}
                />
              </div>
            </section>

            {/* RÉSERVATION */}

            <section className="mt-8">
              <SectionTitle>
                Réservation
              </SectionTitle>

              <div className="space-y-4">
                <InfoRow
                  icon={
                    <Hash className="h-4 w-4" />
                  }
                  label="Référence"
                  value={
                    ticket.reservationId ||
                    "—"
                  }
                />

                <InfoRow
                  icon={
                    <TicketIcon className="h-4 w-4" />
                  }
                  label="Statut"
                  value={
                    ticket.status ===
                    "VALID"
                      ? "Valide"
                      : ticket.status ===
                          "USED"
                        ? "Utilisé"
                        : "Annulé"
                  }
                />
              </div>
            </section>
          </div>

          {/* FOOTER */}

          <div className="border-t border-slate-100 px-6 py-5 text-center">
            <p className="text-xs font-medium text-slate-400">
              SiloCamp • Billetterie officielle
            </p>

            <p className="mt-1 text-[11px] text-slate-300">
              Vérification sécurisée par QR Code
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   SECTION TITLE
   ========================================================= */

function SectionTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <h3 className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
      {children}
    </h3>
  );
}

/* =========================================================
   INFO ROW
   ========================================================= */

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 pb-3 last:border-0">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 break-words text-sm font-semibold text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}