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
  Hash,
  ShieldCheck,
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
  | "not_found"
  | "error";

export default function TicketVerify() {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [state, setState] =
    useState<VerificationState>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    const verify = async () => {
      try {
        const params = new URLSearchParams(
          window.location.search,
        );

        const token = params.get("token")?.trim();

        if (!token) {
          if (mounted) {
            setState("not_found");
            setMessage(
              "Token de vérification manquant.",
            );
          }

          return;
        }

        const result = await verifyTicket(token);

        if (!mounted) {
          return;
        }

        setTicket(result.ticket ?? null);
        setMessage(result.message ?? "");

        if (result.valid) {
          setState("valid");
          return;
        }

        if (result.ticket?.status === "USED") {
          setState("used");
          return;
        }

        if (
          result.ticket?.status === "CANCELLED"
        ) {
          setState("cancelled");
          return;
        }

        setState("not_found");
      } catch (error) {
        console.error(
          "[SiloCamp] Erreur vérification billet :",
          error,
        );

        if (!mounted) {
          return;
        }

        setTicket(null);
        setState("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Impossible de vérifier ce billet.",
        );
      }
    };

    void verify();

    return () => {
      mounted = false;
    };
  }, []);

  if (state === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09070D] px-6">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-gold-400/20 bg-gold-400/5">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-gold-400" />
          </div>

          <h1 className="mt-5 text-xl font-bold text-white">
            Vérification du billet
          </h1>

          <p className="mt-2 text-sm text-white/50">
            Vérification auprès du système SiloCamp...
          </p>
        </div>
      </main>
    );
  }

  if (!ticket) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09070D] px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-7 text-center text-white">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-gold-400/20 bg-gold-400/5">
              <TicketIcon className="h-8 w-8 text-gold-300" />
            </div>

            <h1 className="text-3xl font-black">
              SiloCamp
            </h1>

            <p className="mt-1 text-sm text-white/50">
              Vérification officielle du billet
            </p>
          </div>

          <div className="overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="bg-red-500 px-6 py-8 text-center text-white">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/15">
                <XCircle className="h-12 w-12" />
              </div>

              <h2 className="mt-5 text-2xl font-black">
                BILLET NON VALIDE
              </h2>

              <p className="mt-2 text-sm text-white/80">
                {message ||
                  "Ce QR Code ne correspond à aucun billet enregistré."}
              </p>
            </div>

            <div className="p-6">
              <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-center">
                <AlertCircle className="mx-auto h-7 w-7 text-red-600" />

                <p className="mt-3 text-sm leading-6 text-red-700">
                  Impossible de retrouver ce billet dans
                  la base de données SiloCamp.
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

  const isValid = state === "valid";
  const isUsed = state === "used";
  const isCancelled = state === "cancelled";

  return (
    <main className="min-h-screen bg-[#09070D] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-gold-400/20 bg-gold-400/5">
            <TicketIcon className="h-8 w-8 text-gold-300" />
          </div>

          <h1 className="text-3xl font-black">
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
            {isValid ? (
              <CheckCircle2 className="mx-auto h-14 w-14" />
            ) : (
              <XCircle className="mx-auto h-14 w-14" />
            )}

            <h2 className="mt-4 text-3xl font-black">
              {isValid
                ? "BILLET VALIDE"
                : isUsed
                  ? "BILLET DÉJÀ UTILISÉ"
                  : "BILLET ANNULÉ"}
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/85">
              {message ||
                (isValid
                  ? "Ce billet est enregistré dans le système SiloCamp."
                  : isUsed
                    ? "Ce billet a déjà été présenté."
                    : "Ce billet n'est plus valable.")}
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-8 rounded-2xl bg-slate-950 p-5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                Numéro du billet
              </p>

              <p className="mt-2 break-all text-xl font-black tracking-wider text-white">
                {ticket.ticketNumber}
              </p>
            </div>

            <section>
              <h3 className="mb-4 text-xs font-black uppercase tracking-[0.15em] text-slate-400">
                Participant
              </h3>

              <div className="space-y-3">
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="Prénom"
                  value={
                    ticket.firstName ?? "—"
                  }
                />

                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="Nom"
                  value={
                    ticket.lastName ?? "—"
                  }
                />

                <InfoRow
                  icon={<Phone className="h-4 w-4" />}
                  label="Téléphone"
                  value={ticket.phone ?? "—"}
                />

                <InfoRow
                  icon={<Mail className="h-4 w-4" />}
                  label="E-mail"
                  value={ticket.email}
                />
              </div>
            </section>

            <section className="mt-8 border-t border-slate-100 pt-8">
              <h3 className="mb-4 text-xs font-black uppercase tracking-[0.15em] text-slate-400">
                Événement
              </h3>

              <div className="space-y-3">
                <InfoRow
                  icon={
                    <TicketIcon className="h-4 w-4" />
                  }
                  label="Événement"
                  value={ticket.eventTitle}
                />

                <InfoRow
                  icon={
                    <CalendarDays className="h-4 w-4" />
                  }
                  label="Date"
                  value={ticket.dateLabel}
                />

                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Heure"
                  value={ticket.time}
                />

                <InfoRow
                  icon={
                    <MapPin className="h-4 w-4" />
                  }
                  label="Lieu"
                  value={
                    ticket.venue && ticket.city
                      ? `${ticket.venue}, ${ticket.city}`
                      : ticket.venue ||
                        ticket.city
                  }
                />
              </div>
            </section>

            <section className="mt-8 border-t border-slate-100 pt-8">
              <h3 className="mb-4 text-xs font-black uppercase tracking-[0.15em] text-slate-400">
                Réservation
              </h3>

              <div className="space-y-3">
                <InfoRow
                  icon={<Hash className="h-4 w-4" />}
                  label="Référence"
                  value={
                    ticket.reservationId ?? "—"
                  }
                />

                <InfoRow
                  icon={
                    <ShieldCheck className="h-4 w-4" />
                  }
                  label="Statut"
                  value={
                    isValid
                      ? "VALIDE"
                      : isUsed
                        ? "DÉJÀ UTILISÉ"
                        : "ANNULÉ"
                  }
                />

                <InfoRow
                  icon={
                    <TicketIcon className="h-4 w-4" />
                  }
                  label="Quantité"
                  value={String(
                    ticket.quantity,
                  )}
                />
              </div>
            </section>

            <div
              className={`mt-8 rounded-2xl border p-5 text-center ${
                isValid
                  ? "border-emerald-200 bg-emerald-50"
                  : isUsed
                    ? "border-amber-200 bg-amber-50"
                    : "border-red-200 bg-red-50"
              }`}
            >
              {isValid && (
                <>
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />

                  <p className="mt-3 font-black text-emerald-700">
                    BILLET VALIDE
                  </p>

                  <p className="mt-1 text-xs leading-5 text-emerald-600">
                    Ce billet est valide et n'a pas encore
                    été utilisé à l'entrée.
                  </p>
                </>
              )}

              {isUsed && (
                <>
                  <XCircle className="mx-auto h-8 w-8 text-amber-600" />

                  <p className="mt-3 font-black text-amber-700">
                    BILLET DÉJÀ UTILISÉ
                  </p>

                  <p className="mt-1 text-xs leading-5 text-amber-600">
                    Ce billet a déjà été présenté à
                    l'entrée.
                  </p>
                </>
              )}

              {isCancelled && (
                <>
                  <XCircle className="mx-auto h-8 w-8 text-red-600" />

                  <p className="mt-3 font-black text-red-700">
                    BILLET ANNULÉ
                  </p>

                  <p className="mt-1 text-xs leading-5 text-red-600">
                    Ce billet ne permet plus l'accès.
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
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-slate-900">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}