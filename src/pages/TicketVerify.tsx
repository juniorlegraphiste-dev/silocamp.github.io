import { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Ticket as TicketIcon,
  User,
  Phone,
  Mail,
  CalendarDays,
  MapPin,
  Clock,
  ShieldCheck,
} from "lucide-react";

import {
  verifyTicket,
  type Ticket,
} from "@/services/ticketService";

export default function TicketVerify() {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function verify() {
      try {
        const params = new URLSearchParams(
          window.location.search,
        );

        const token = params.get("token")?.trim();

        if (!token) {
          if (mounted) {
            setMessage(
              "Aucun token de vérification n'a été fourni.",
            );
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

        setTicket(null);

        setMessage(
          error instanceof Error
            ? error.message
            : "Impossible de vérifier ce billet.",
        );

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
      <main className="flex min-h-screen items-center justify-center bg-[#09070d] px-6">
        <div className="text-center text-white">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-amber-400/20 bg-amber-400/5">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-amber-400" />
          </div>

          <h1 className="text-xl font-semibold">
            Vérification du billet
          </h1>

          <p className="mt-2 text-sm text-white/50">
            Connexion au système SiloCamp...
          </p>
        </div>
      </main>
    );
  }

  if (!ticket) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09070d] px-6 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center text-white">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <TicketIcon className="h-8 w-8 text-amber-400" />
            </div>

            <h1 className="text-2xl font-bold">
              SiloCamp
            </h1>

            <p className="mt-1 text-sm text-white/50">
              Vérification officielle des billets
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-red-400/20 bg-white shadow-2xl">
            <div className="bg-red-500 px-6 py-8 text-center text-white">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/15">
                <XCircle className="h-12 w-12" />
              </div>

              <h2 className="mt-5 text-2xl font-black">
                BILLET NON VALIDE
              </h2>

              <p className="mt-2 text-sm text-white/80">
                Vérification impossible
              </p>
            </div>

            <div className="p-6">
              <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-center">
                <AlertCircle className="mx-auto h-7 w-7 text-red-600" />

                <p className="mt-3 text-sm leading-6 text-red-700">
                  {message ||
                    "Ce QR Code ne correspond à aucun billet enregistré dans le système SiloCamp."}
                </p>
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Sécurité
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Si vous pensez qu'il s'agit d'une erreur,
                  contactez l'organisation SiloCamp.
                </p>
              </div>
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

  const isValid = ticket.status === "VALID";
  const isUsed = ticket.status === "USED";
  const isCancelled = ticket.status === "CANCELLED";

  return (
    <main className="min-h-screen bg-[#09070d] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/5">
            <TicketIcon className="h-8 w-8 text-amber-400" />
          </div>

          <h1 className="text-2xl font-bold">
            SiloCamp
          </h1>

          <p className="mt-1 text-sm text-white/50">
            Vérification officielle du billet
          </p>
        </div>

        <div className="overflow-hidden rounded-[30px] bg-white shadow-2xl">
          <div
            className={`px-6 py-8 text-center text-white ${
              isValid
                ? "bg-emerald-500"
                : isUsed
                  ? "bg-amber-500"
                  : "bg-red-500"
            }`}
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/15">
              {isValid ? (
                <CheckCircle2 className="h-12 w-12" />
              ) : (
                <XCircle className="h-12 w-12" />
              )}
            </div>

            <h2 className="mt-5 text-3xl font-black">
              {isValid
                ? "BILLET VALIDE"
                : isUsed
                  ? "BILLET DÉJÀ UTILISÉ"
                  : "BILLET ANNULÉ"}
            </h2>

            <p className="mt-2 text-sm text-white/80">
              {isValid
                ? "Ce billet est enregistré dans le système SiloCamp."
                : isUsed
                  ? "Ce billet a déjà été présenté à l'entrée."
                  : "Ce billet ne permet plus l'accès à l'événement."}
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Numéro du billet
              </p>

              <p className="mt-2 break-all text-xl font-black tracking-wide text-slate-900">
                {ticket.ticketNumber}
              </p>
            </div>

            <section>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <User className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    Participant
                  </h3>

                  <p className="text-xs text-slate-400">
                    Informations du titulaire
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="Prénom"
                  value={ticket.firstName}
                />

                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="Nom"
                  value={ticket.lastName}
                />

                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="Nom complet"
                  value={ticket.participantName}
                />

                <InfoRow
                  icon={<Phone className="h-4 w-4" />}
                  label="Contact"
                  value={ticket.phone}
                />

                <InfoRow
                  icon={<Mail className="h-4 w-4" />}
                  label="E-mail"
                  value={ticket.email}
                />
              </div>
            </section>

            <section className="mt-9 border-t border-slate-100 pt-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <CalendarDays className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    Événement
                  </h3>

                  <p className="text-xs text-slate-400">
                    Informations de l'événement
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <InfoRow
                  icon={<TicketIcon className="h-4 w-4" />}
                  label="Événement"
                  value={ticket.eventTitle}
                />

                <InfoRow
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Date"
                  value={ticket.dateLabel}
                />

                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Heure"
                  value={ticket.time}
                />

                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Durée"
                  value={ticket.duration}
                />

                <InfoRow
                  icon={<MapPin className="h-4 w-4" />}
                  label="Lieu"
                  value={
                    ticket.venue && ticket.city
                      ? `${ticket.venue}, ${ticket.city}`
                      : ticket.venue || ticket.city
                  }
                />
              </div>
            </section>

            <section className="mt-9 border-t border-slate-100 pt-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    Vérification
                  </h3>

                  <p className="text-xs text-slate-400">
                    État du billet
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <InfoRow
                  icon={<TicketIcon className="h-4 w-4" />}
                  label="Référence"
                  value={ticket.reservationId}
                />

                <InfoRow
                  icon={<TicketIcon className="h-4 w-4" />}
                  label="Quantité"
                  value={String(ticket.quantity)}
                />

                <InfoRow
                  icon={<ShieldCheck className="h-4 w-4" />}
                  label="Statut"
                  value={
                    isValid
                      ? "VALIDE"
                      : isUsed
                        ? "DÉJÀ UTILISÉ"
                        : "ANNULÉ"
                  }
                />
              </div>
            </section>

            <div
              className={`mt-8 rounded-2xl p-5 text-center ${
                isValid
                  ? "border border-emerald-200 bg-emerald-50"
                  : isUsed
                    ? "border border-amber-200 bg-amber-50"
                    : "border border-red-200 bg-red-50"
              }`}
            >
              {isValid ? (
                <>
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />

                  <p className="mt-3 font-bold text-emerald-700">
                    ACCÈS AUTORISÉ
                  </p>

                  <p className="mt-1 text-xs leading-5 text-emerald-600">
                    Ce billet est actuellement valide.
                  </p>
                </>
              ) : isUsed ? (
                <>
                  <XCircle className="mx-auto h-8 w-8 text-amber-600" />

                  <p className="mt-3 font-bold text-amber-700">
                    ACCÈS DÉJÀ UTILISÉ
                  </p>

                  <p className="mt-1 text-xs leading-5 text-amber-600">
                    Ce billet a déjà été présenté.
                  </p>
                </>
              ) : (
                <>
                  <XCircle className="mx-auto h-8 w-8 text-red-600" />

                  <p className="mt-3 font-bold text-red-700">
                    ACCÈS REFUSÉ
                  </p>

                  <p className="mt-1 text-xs leading-5 text-red-600">
                    Ce billet est annulé.
                  </p>
                </>
              )}
            </div>
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
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 pb-3 last:border-0">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 break-words text-sm font-semibold text-slate-900">
          {value ?? "—"}
        </p>
      </div>
    </div>
  );
}