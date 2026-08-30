"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Ticket as TicketIcon,
} from "lucide-react";

import {
  verifyTicket,
  type Ticket,
} from "@/services/ticketService";

export default function TicketVerifyPage() {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function verify() {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token")?.trim();

        if (!token) {
          if (mounted) {
            setMessage("Token de vérification manquant.");
            setLoading(false);
          }
          return;
        }

        const result = await verifyTicket(token);

        if (!mounted) {
          return;
        }

        setTicket(result.ticket ?? null);
        setMessage(result.message);
        setLoading(false);
      } catch (error) {
        if (!mounted) {
          return;
        }

        setMessage(
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors de la vérification du billet.",
        );
        setTicket(null);
        setLoading(false);
      }
    }

    void verify();

    return () => {
      mounted = false;
    };
  }, []);

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
            {message ||
              "Ce QR Code ne correspond à aucun billet enregistré dans le système SiloCamp."}
          </p>

          <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            BILLET NON VALIDE
          </div>
        </div>
      </main>
    );
  }

  const isValid = ticket.status === "VALID";
  const isUsed = ticket.status === "USED";
  const isCancelled = ticket.status === "CANCELLED";

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-lg">
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

        <div className="overflow-hidden rounded-[28px] bg-white shadow-2xl">
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
                  : isCancelled
                    ? "BILLET ANNULÉ"
                    : "BILLET NON VALIDE"}
            </h2>

            <p className="mt-1 text-sm text-white/80">
              {message ||
                (isValid
                  ? "Ce billet est enregistré dans le système."
                  : isUsed
                    ? "Ce billet a déjà été présenté."
                    : "Ce billet n'est plus valable.")}
            </p>
          </div>

          <div className="p-6">
            <div className="mb-6 rounded-2xl bg-slate-50 p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Numéro du billet
              </p>

              <p className="mt-1 text-xl font-black tracking-wide text-slate-900">
                {ticket.ticketNumber}
              </p>
            </div>

            <section>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
                Participant
              </h3>

              <div className="space-y-4">
                <InfoRow
                  label="Prénom"
                  value={ticket.firstName}
                />

                <InfoRow
                  label="Nom"
                  value={ticket.lastName}
                />

                <InfoRow
                  label="Participant"
                  value={ticket.participantName}
                />

                <InfoRow
                  label="Téléphone"
                  value={ticket.phone}
                />

                <InfoRow
                  label="E-mail"
                  value={ticket.email}
                />
              </div>
            </section>

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
                  label="Durée"
                  value={ticket.duration}
                />

                <InfoRow
                  label="Lieu"
                  value={
                    ticket.venue && ticket.city
                      ? `${ticket.venue}, ${ticket.city}`
                      : ticket.venue || ticket.city
                  }
                />
              </div>
            </section>

            <section className="mt-8">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
                Réservation
              </h3>

              <div className="space-y-4">
                <InfoRow
                  label="Référence"
                  value={ticket.reservationId}
                />

                <InfoRow
                  label="Quantité"
                  value={String(ticket.quantity)}
                />

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

            {ticket.usedAt && (
              <section className="mt-8">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
                  Utilisation
                </h3>

                <InfoRow
                  label="Présenté le"
                  value={formatDate(ticket.usedAt)}
                />
              </section>
            )}

            {ticket.cancelledAt && (
              <section className="mt-8">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
                  Annulation
                </h3>

                <InfoRow
                  label="Annulé le"
                  value={formatDate(ticket.cancelledAt)}
                />
              </section>
            )}

            {isValid && (
              <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-600" />

                <p className="mt-2 text-sm font-semibold text-emerald-700">
                  Ce billet est actuellement valide.
                </p>

                <p className="mt-1 text-xs leading-5 text-emerald-600">
                  La validation définitive à l'entrée doit être effectuée
                  par le scanner SiloCamp.
                </p>
              </div>
            )}

            {isUsed && (
              <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
                <XCircle className="mx-auto h-7 w-7 text-amber-600" />

                <p className="mt-2 text-sm font-semibold text-amber-700">
                  Ce billet a déjà été utilisé.
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-600">
                  Il ne peut plus être utilisé pour accéder à l'événement.
                </p>
              </div>
            )}

            {isCancelled && (
              <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-center">
                <XCircle className="mx-auto h-7 w-7 text-red-600" />

                <p className="mt-2 text-sm font-semibold text-red-700">
                  Ce billet a été annulé.
                </p>

                <p className="mt-1 text-xs leading-5 text-red-600">
                  Il ne permet plus l'accès à l'événement.
                </p>
              </div>
            )}
          </div>

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

function InfoRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-slate-100 pb-3 last:border-0">
      <span className="text-sm text-slate-400">
        {label}
      </span>

      <span className="max-w-[65%] break-words text-right text-sm font-semibold text-slate-900">
        {value ?? "—"}
      </span>
    </div>
  );
}

function formatDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}