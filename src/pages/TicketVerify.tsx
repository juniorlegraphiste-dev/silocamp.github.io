import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  ShieldCheck,
  Ticket,
  UserRound,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import {
  verifyTicket,
  type Ticket as SiloCampTicket,
} from "@/services/ticketService";

type VerificationStatus =
  | "loading"
  | "valid"
  | "used"
  | "cancelled"
  | "not-found"
  | "error"
  | "missing-token";

type VerificationResult = {
  valid?: boolean;
  ticket?: SiloCampTicket | null;
  reason?: string;
  message?: string;
};

function getTokenFromUrl(): string {
  if (typeof window === "undefined") return "";

  const params = new URLSearchParams(window.location.search);
  return params.get("token")?.trim() || "";
}

function getVerificationStatus(
  result: VerificationResult
): VerificationStatus {
  if (result.valid && result.ticket) {
    return "valid";
  }

  const reason = String(result.reason || "").toUpperCase();

  if (
    reason === "TICKET_ALREADY_USED" ||
    reason === "USED" ||
    reason.includes("ALREADY_USED")
  ) {
    return "used";
  }

  if (
    reason === "TICKET_CANCELLED" ||
    reason === "CANCELLED" ||
    reason.includes("CANCEL")
  ) {
    return "cancelled";
  }

  if (
    reason === "TICKET_NOT_FOUND" ||
    reason === "NOT_FOUND" ||
    reason.includes("NOT_FOUND")
  ) {
    return "not-found";
  }

  return "error";
}

function formatTime(value?: string | null): string {
  if (!value) return "09h00";

  return value.replace(":", "h");
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-gold-400/10 bg-ink-950/40 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-400/10 text-gold-300">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold-300">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-medium leading-6 text-cream">
          {value}
        </p>
      </div>
    </div>
  );
}

function ValidTicketPage({
  ticket,
}: {
  ticket: SiloCampTicket;
}) {
  const participantName =
    ticket.participantName?.trim() ||
    `${ticket.firstName ?? ""} ${ticket.lastName ?? ""}`.trim() ||
    "Participant";

  const date =
    ticket.dateLabel?.trim() || "Samedi 12 Décembre 2026";

  const time = formatTime(ticket.time);

  const venue =
    ticket.venue?.trim() || "Le Carré d'Or Casablanca";

  const city = ticket.city?.trim() || "Casablanca";

  const childrenUnder12 = Number(ticket.childrenUnder12 ?? 0);
  const children12Plus = Number(ticket.children12Plus ?? 0);
  const childrenTotal = childrenUnder12 + children12Plus;

  return (
    <main className="min-h-screen bg-ink-950 px-4 pb-20 pt-28 md:pt-32">
      <div className="mx-auto w-full max-w-3xl">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            Billet valide
          </div>

          <h1 className="mt-6 text-3xl font-black tracking-tight text-cream sm:text-4xl">
            Accès{" "}
            <span className="text-gold-gradient">
              confirmé
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-cream-dim">
            Votre billet a été vérifié avec succès et votre accès au Camp
            International Silo 2026 est confirmé.
          </p>
        </div>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-gold-400/15 bg-ink-900/60 shadow-2xl">
          <div className="border-b border-gold-400/10 bg-gold-400/5 p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-400/10 text-gold-300">
                <Ticket className="h-6 w-6" />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-300">
                  Silo Camp
                </p>

                <h2 className="mt-1 text-xl font-black text-cream sm:text-2xl">
                  Camp International Silo 2026
                </h2>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-300">
                Participant
              </p>

              <h3 className="mt-2 text-2xl font-black text-cream sm:text-3xl">
                {participantName}
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoItem
                icon={<Ticket className="h-5 w-5" />}
                label="Numéro du billet"
                value={ticket.ticketNumber || "—"}
              />

              <InfoItem
                icon={<ShieldCheck className="h-5 w-5" />}
                label="Réservation"
                value={ticket.reservationId || "—"}
              />

              <InfoItem
                icon={<CalendarDays className="h-5 w-5" />}
                label="Date"
                value={date}
              />

              <InfoItem
                icon={<Clock3 className="h-5 w-5" />}
                label="Heure"
                value={time}
              />

              <InfoItem
                icon={<MapPin className="h-5 w-5" />}
                label="Lieu"
                value={`${venue}, ${city}`}
              />

              <InfoItem
                icon={<UserRound className="h-5 w-5" />}
                label="Email"
                value={ticket.email || "—"}
              />

              {ticket.phone && (
                <InfoItem
                  icon={<UserRound className="h-5 w-5" />}
                  label="Téléphone"
                  value={ticket.phone}
                />
              )}
            </div>

            {childrenTotal > 0 && (
              <div className="mt-6 rounded-2xl border border-gold-400/10 bg-gold-400/5 p-5">
                <div className="flex items-center gap-3">
                  <UserRound className="h-5 w-5 text-gold-300" />

                  <div>
                    <p className="text-sm font-bold text-cream">
                      Accompagnants
                    </p>

                    <p className="text-xs text-cream-dim">
                      Informations organisationnelles
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-ink-950/50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-cream-dim">
                      Moins de 12 ans
                    </p>

                    <p className="mt-1 text-lg font-black text-gold-300">
                      {childrenUnder12}
                    </p>
                  </div>

                  <div className="rounded-xl bg-ink-950/50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-cream-dim">
                      12 ans et plus
                    </p>

                    <p className="mt-1 text-lg font-black text-gold-300">
                      {children12Plus}
                    </p>
                  </div>

                  <div className="rounded-xl bg-ink-950/50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-cream-dim">
                      Total
                    </p>

                    <p className="mt-1 text-lg font-black text-gold-300">
                      {childrenTotal}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />

                <div>
                  <p className="text-sm font-bold text-emerald-300">
                    Accès confirmé
                  </p>

                  <p className="mt-1 text-xs leading-6 text-cream-dim">
                    Ce billet est actuellement valide. Présentez simplement
                    votre billet à l'équipe d'accueil lors de votre arrivée.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 flex justify-center">
          <Link
            to="/"
            className="btn-ghost inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </main>
  );
}

function InvalidTicketPage({
  status,
  message,
}: {
  status: "used" | "cancelled" | "not-found" | "error";
  message?: string;
}) {
  const config = {
    used: {
      icon: AlertTriangle,
      badge: "Billet déjà utilisé",
      title: "Billet déjà utilisé",
      description:
        "Ce billet a déjà été contrôlé et enregistré comme utilisé. Il ne peut pas être utilisé une seconde fois.",
      color:
        "border-amber-400/20 bg-amber-400/5 text-amber-300",
    },

    cancelled: {
      icon: XCircle,
      badge: "Billet annulé",
      title: "Billet annulé",
      description:
        "Ce billet a été annulé et n'autorise plus l'accès au Camp International Silo 2026.",
      color:
        "border-red-400/20 bg-red-400/5 text-red-300",
    },

    "not-found": {
      icon: XCircle,
      badge: "Billet introuvable",
      title: "Billet introuvable",
      description:
        "Aucun billet correspondant à cette demande n'a été trouvé dans le système SiloCamp.",
      color:
        "border-red-400/20 bg-red-400/5 text-red-300",
    },

    error: {
      icon: AlertTriangle,
      badge: "Erreur de vérification",
      title: "Vérification impossible",
      description:
        message ||
        "Une erreur est survenue pendant la vérification du billet. Veuillez réessayer.",
      color:
        "border-red-400/20 bg-red-400/5 text-red-300",
    },
  };

  const current = config[status];
  const Icon = current.icon;

  return (
    <main className="min-h-screen bg-ink-950 px-4 pb-20 pt-28 md:pt-32">
      <div className="mx-auto w-full max-w-2xl">
        <div className="overflow-hidden rounded-[2rem] border border-gold-400/15 bg-ink-900/60 shadow-2xl">
          <div className="p-8 text-center sm:p-12">
            <div
              className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full border ${current.color}`}
            >
              <Icon className="h-9 w-9" />
            </div>

            <div
              className={`mx-auto mt-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] ${current.color}`}
            >
              <Icon className="h-4 w-4" />
              {current.badge}
            </div>

            <h1 className="mt-6 text-3xl font-black tracking-tight text-cream sm:text-4xl">
              {current.title}
            </h1>

            <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-cream-dim">
              {current.description}
            </p>
          </div>

          <div className="border-t border-gold-400/10 p-6 sm:p-8">
            <div className="rounded-2xl border border-gold-400/10 bg-ink-950/40 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold-300" />

                <div>
                  <p className="text-sm font-bold text-cream">
                    Vérification SiloCamp
                  </p>

                  <p className="mt-1 text-xs leading-6 text-cream-dim">
                    Pour toute question concernant votre billet, veuillez
                    contacter l'organisation du Camp International Silo 2026.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {status === "error" && (
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="btn-gold inline-flex flex-1 items-center justify-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Réessayer
                </button>
              )}

              <Link
                to="/"
                className="btn-ghost inline-flex flex-1 items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour à l'accueil
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function MissingTokenPage() {
  return (
    <main className="min-h-screen bg-ink-950 px-4 pb-20 pt-28 md:pt-32">
      <div className="mx-auto w-full max-w-2xl">
        <div className="overflow-hidden rounded-[2rem] border border-gold-400/15 bg-ink-900/60 shadow-2xl">
          <div className="p-8 text-center sm:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold-400/10 text-gold-300">
              <Ticket className="h-9 w-9" />
            </div>

            <h1 className="mt-6 text-3xl font-black tracking-tight text-cream sm:text-4xl">
              Lien de vérification invalide
            </h1>

            <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-cream-dim">
              Ce lien ne contient pas les informations nécessaires pour
              vérifier le billet.
            </p>
          </div>

          <div className="border-t border-gold-400/10 p-6 sm:p-8">
            <Link
              to="/"
              className="btn-gold inline-flex w-full items-center justify-center gap-2"
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

export default function TicketVerify() {
  const [status, setStatus] =
    useState<VerificationStatus>("loading");

  const [ticket, setTicket] =
    useState<SiloCampTicket | null>(null);

  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      const token = getTokenFromUrl();

      if (!token) {
        if (!cancelled) {
          setStatus("missing-token");
        }

        return;
      }

      try {
        setStatus("loading");
        setMessage("");

        const result = (await verifyTicket(
          token
        )) as VerificationResult;

        if (cancelled) return;

        if (result.valid && result.ticket) {
          setTicket(result.ticket);
          setStatus("valid");
          return;
        }

        setTicket(null);
        setMessage(result.message || "");
        setStatus(getVerificationStatus(result));
      } catch (error) {
        console.error(
          "[SiloCamp] Erreur de vérification du billet :",
          error
        );

        if (!cancelled) {
          setTicket(null);
          setMessage(
            "Impossible de contacter le service de vérification du billet."
          );
          setStatus("error");
        }
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-ink-950 px-4 pb-20 pt-28 md:pt-32">
        <div className="mx-auto w-full max-w-2xl">
          <div className="overflow-hidden rounded-[2rem] border border-gold-400/15 bg-ink-900/60 shadow-2xl">
            <div className="p-10 text-center sm:p-14">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold-400/10 text-gold-300">
                <RefreshCw className="h-9 w-9 animate-spin" />
              </div>

              <h1 className="mt-7 text-2xl font-black text-cream sm:text-3xl">
                Vérification du billet
              </h1>

              <p className="mt-3 text-sm leading-7 text-cream-dim">
                Nous vérifions votre billet SiloCamp...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (status === "missing-token") {
    return <MissingTokenPage />;
  }

  if (status === "valid" && ticket) {
    return <ValidTicketPage ticket={ticket} />;
  }

  return (
    <InvalidTicketPage
      status={
        status as
          | "used"
          | "cancelled"
          | "not-found"
          | "error"
      }
      message={message}
    />
  );
}