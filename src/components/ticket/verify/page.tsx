"use client";

import { useEffect, useState } from "react";

import {
  CheckCircle2,
  XCircle,
  Ticket as TicketIcon,
} from "lucide-react";

import {
  getTicketByVerificationToken,
  type Ticket,
} from "@/services/ticketService";

export default function TicketVerifyPage() {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setLoading(false);
      return;
    }

    const foundTicket = getTicketByVerificationToken(token);

    setTicket(foundTicket);
    setLoading(false);
  }, []);

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
        <div className="text-center text-white">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />

          <p className="text-sm text-white/70">
            Vérification du billet...
          </p>
        </div>
      </main>
    );
  }

  /* =========================================================
     TICKET NOT FOUND
  ========================================================= */

  if (!ticket) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-10">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-9 w-9 text-red-600" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Billet introuvable
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Ce QR Code ne correspond à aucun billet enregistré
            dans le système SiloCamp.
          </p>

          <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            BILLET NON VALIDE
          </div>
        </div>
      </main>
    );
  }

  /* =========================================================
     STATUS
  ========================================================= */

  const isUsed = ticket.status === "USED";
  const isValid = ticket.status === "VALID";

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-lg">
        {/* HEADER */}

        <div className="mb-6 text-center text-white">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <TicketIcon className="h-7 w-7" />
          </div>

          <h1 className="text-2xl font-bold">
            SiloCamp
          </h1>

          <p className="mt-1 text-sm text-white/60">
            Vérification du billet
          </p>
        </div>

        {/* TICKET CARD */}

        <div className="overflow-hidden rounded-[28px] bg-white shadow-2xl">
          {/* STATUS */}

          <div
            className={`px-6 py-7 text-center ${
              isValid
                ? "bg-emerald-500"
                : isUsed
                  ? "bg-amber-500"
                  : "bg-red-500"
            }`}
          >
            {isValid ? (
              <CheckCircle2 className="mx-auto h-12 w-12 text-white" />
            ) : (
              <XCircle className="mx-auto h-12 w-12 text-white" />
            )}

            <h2 className="mt-3 text-2xl font-black text-white">
              {isValid
                ? "BILLET VALIDE"
                : isUsed
                  ? "BILLET DÉJÀ UTILISÉ"
                  : "BILLET ANNULÉ"}
            </h2>

            <p className="mt-1 text-sm text-white/80">
              {isValid
                ? "Ce billet est enregistré dans le système."
                : isUsed
                  ? "Ce billet a déjà été présenté."
                  : "Ce billet n'est plus valable."}
            </p>
          </div>

          {/* CONTENT */}

          <div className="p-6">
            {/* NUMÉRO */}

            <div className="mb-6 rounded-2xl bg-slate-50 p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Numéro du billet
              </p>

              <p className="mt-1 text-xl font-black tracking-wide text-slate-900">
                {ticket.ticketNumber}
              </p>
            </div>

            {/* PARTICIPANT */}

            <section>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
                Participant
              </h3>

              <div className="space-y-4">
                <InfoRow
                  label="Prénom"
                  value={ticket.firstName || "—"}
                />

                <InfoRow
                  label="Nom"
                  value={ticket.lastName || "—"}
                />

                <InfoRow
                  label="Téléphone"
                  value={ticket.phone || "—"}
                />

                <InfoRow
                  label="E-mail"
                  value={ticket.email || "—"}
                />
              </div>
            </section>

            {/* EVENT */}

            <section className="mt-8">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
                Événement
              </h3>

              <div className="space-y-4">
                <InfoRow
                  label="Événement"
                  value={ticket.eventTitle}
                />

                <InfoRow
                  label="Date"
                  value={ticket.dateLabel}
                />

                <InfoRow
                  label="Heure"
                  value={ticket.time}
                />

                <InfoRow
                  label="Lieu"
                  value={`${ticket.venue}, ${ticket.city}`}
                />
              </div>
            </section>

            {/* RESERVATION */}

            <section className="mt-8">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
                Réservation
              </h3>

              <InfoRow
                label="Référence"
                value={ticket.reservationId}
              />

              <div className="mt-4">
                <InfoRow
                  label="Statut"
                  value={
                    ticket.status === "VALID"
                      ? "Valide"
                      : ticket.status === "USED"
                        ? "Utilisé"
                        : "Annulé"
                  }
                />
              </div>
            </section>
          </div>

          {/* FOOTER */}

          <div className="border-t border-slate-100 px-6 py-5 text-center">
            <p className="text-xs text-slate-400">
              SiloCamp • Billetterie officielle
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-slate-100 pb-3 last:border-0">
      <span className="text-sm text-slate-400">
        {label}
      </span>

      <span className="max-w-[65%] break-words text-right text-sm font-semibold text-slate-900">
        {value}
      </span>
    </div>
  );
}