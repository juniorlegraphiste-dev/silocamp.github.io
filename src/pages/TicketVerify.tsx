import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
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

function normalizeStatus(result: VerificationResult): VerificationStatus {
  if (result.valid) return "valid";

  const reason = String(result.reason || "").toUpperCase();

  if (
    reason === "TICKET_ALREADY_USED" ||
    reason === "USED" ||
    reason.includes("ALREADY_USED") ||
    reason.includes("USED")
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

function formatDate(value?: string | Date | null): string {
  if (!value) return "Samedi 12 Décembre 2026";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatTime(value?: string | null): string {
  if (!value) return "09h00";

  return value.replace(":", "h").replace(/(\d{1,2})h(\d{1,2})$/, (_, h, m) => {
    return `${String(h).padStart(2, "0")}h${String(m).padStart(2, "0")}`;
  });
}

function formatChildren(ticket: SiloCampTicket) {
  const under12 = Number(ticket.childrenUnder12 ?? 0);
  const over12 = Number(ticket.children12Plus ?? 0);
  const total = under12 + over12;

  return {
    under12,
    over12,
    total,
  };
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
    <div className="rounded-2xl border border-gold-400/10 bg-ink-950/40 p-4">
      <div className="flex items-center gap-2 text-gold-300">
        {icon}
        <span className="text-[11px] font-bold uppercase tracking-[0.16em]">
          {label}
        </span>
      </div>

      <p className="mt-2 break-words text-sm font-medium leading-6 text-cream">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
  children,
}: {
  status: "valid" | "used" | "cancelled" | "error";
  children: React.ReactNode;
}) {
  const styles = {
    valid: "border-emerald-400/20 bg-emerald-400/5 text-emerald-300",
    used: "border-amber-400/20 bg-amber-400/5 text-amber-300",
    cancelled: "border-red-400/20 bg-red-400/5 text-red-300",
    error: "border-red-400/20 bg-red-400/5 text-red-300",
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] ${styles[status]}`}
    >
      {status === "valid" && <CheckCircle2 className="h-4 w-4" />}
      {status === "used" && <AlertTriangle className="h-4 w-4" />}
      {status === "cancelled" && <XCircle className="h-4 w-4" />}
      {status === "error" && <AlertTriangle className="h-4 w-4" />}
      {children}
    </div>
  );
}

function ValidTicketPage({ ticket }: { ticket: SiloCampTicket }) {
  const children = formatChildren(ticket);

  const participantName =
    ticket.participantName?.trim() ||
    `${ticket.firstName ?? ""} ${ticket.lastName ?? ""}`.trim() ||
    "Participant";

  const dateLabel = ticket.dateLabel?.trim() || formatDate(null);

  const time = formatTime(ticket.time);

  const venue = ticket.venue?.trim() || "Le Carré d'Or Casablanca";

  const city = ticket.city?.trim() || "Casablanca";

  return (
    <main className="min-h-screen bg-ink-950 pb-24 pt-28 md:pt-32">
      <div className="container-px mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <StatusBadge status="valid">Billet valide</StatusBadge>

          <h1 className="mt-6 text-3xl font-black tracking-tight text-cream sm:text-4xl md:text-5xl">
            Accès <span className="text-gold-gradient">confirmé</span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-cream-dim sm:text-base">
            Ce billet a été vérifié avec succès. Il est enregistré dans le
            système SiloCamp et peut être présenté à l'entrée du Camp.
          </p>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-gold-400/15 bg-ink-900/60 shadow-2xl">
          <div className="border-b border-gold-400/10 bg-gold-400/5 p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-400/10 text-gold-300">
                    <Ticket className="h-6 w-6" />
                  </div>

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-300">
                      Silo Camp
                    </p>

                    <h2 className="mt-1 text-xl font-black text-cream sm:text-2xl">
                      Camp International Silo 2026
                    </h2>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 px-5 py-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-300" />

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
                      Statut
                    </p>

                    <p className="mt-1 text-sm font-bold text-cream">
                      Accès confirmé
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_280px]">
            <div>
              <div className="mb-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-300">
                  Informations du participant
                </p>

                <h3 className="mt-2 text-2xl font-black text-cream">
                  {participantName}
                </h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <InfoCard
                  icon={<UserRound className="h-4 w-4" />}
                  label="Participant"
                  value={participantName}
                />

                <InfoCard
                  icon={<Ticket className="h-4 w-4" />}
                  label="Billet"
                  value={ticket.ticketNumber || "—"}
                />

                <InfoCard
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Date"
                  value={dateLabel}
                />

                <InfoCard
                  icon={<Clock3 className="h-4 w-4" />}
                  label="Heure"
                  value={time}
                />

                <InfoCard
                  icon={<MapPin className="h-4 w-4" />}
                  label="Lieu"
                  value={`${venue}, ${city}`}
                />

                <InfoCard
                  icon={<Mail className="h-4 w-4" />}
                  label="Email"
                  value={ticket.email || "—"}
                />

                {ticket.phone && (
                  <InfoCard
                    icon={<UserRound className="h-4 w-4" />}
                    label="Téléphone"
                    value={ticket.phone}
                  />
                )}

                {ticket.reservationId && (
                  <InfoCard
                    icon={<ShieldCheck className="h-4 w-4" />}
                    label="Réservation"
                    value={ticket.reservationId}
                  />
                )}
              </div>

              <div className="mt-6 rounded-2xl border border-gold-400/10 bg-ink-950/40 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold-300" />

                  <div>
                    <p className="text-sm font-bold text-cream">
                      Billet authentifié
                    </p>

                    <p className="mt-1 text-xs leading-6 text-cream-dim">
                      Ce billet a été vérifié par SiloCamp. Présentez votre QR
                      Code à l'entrée pour permettre le contrôle de votre accès.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <aside className="flex flex-col items-center rounded-[1.75rem] border border-gold-400/10 bg-white p-5">
              <div className="w-full text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink-900">
                  QR Code
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Présentez ce code à l'entrée
                </p>
              </div>

              <div className="mt-5 flex h-[220px] w-[220px] items-center justify-center rounded-2xl bg-white">
                {ticket.verificationToken ? (
                  <QRCodeDisplay
                    ticketNumber={ticket.ticketNumber}
                    token={ticket.verificationToken}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gray-100 p-6 text-center text-sm text-gray-500">
                    QR Code indisponible
                  </div>
                )}
              </div>

              <div className="mt-5 w-full rounded-xl bg-ink-950 px-4 py-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-300">
                  Numéro du billet
                </p>

                <p className="mt-1 break-all text-xs font-bold text-cream">
                  {ticket.ticketNumber || "—"}
                </p>
              </div>
            </aside>
          </div>

          {children.total > 0 && (
            <div className="border-t border-gold-400/10 bg-gold-400/5 p-6 sm:p-8">
              <div className="mb-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-300">
                  Accompagnants
                </p>

                <h3 className="mt-2 text-xl font-black text-cream">
                  Informations enfants
                </h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-gold-400/10 bg-ink-950/40 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-cream-dim">
                    Moins de 12 ans
                  </p>

                  <p className="mt-2 text-2xl font-black text-gold-300">
                    {children.under12}
                  </p>
                </div>

                <div className="rounded-2xl border border-gold-400/10 bg-ink-950/40 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-cream-dim">
                    12 ans et plus
                  </p>

                  <p className="mt-2 text-2xl font-black text-gold-300">
                    {children.over12}
                  </p>
                </div>

                <div className="rounded-2xl border border-gold-400/10 bg-ink-950/40 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-cream-dim">
                    Total enfants
                  </p>

                  <p className="mt-2 text-2xl font-black text-gold-300">
                    {children.total}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        <div className="mt-8 flex justify-center">
          <Link to="/" className="btn-ghost inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </main>
  );
}

function QRCodeDisplay({
  ticketNumber,
  token,
}: {
  ticketNumber: string;
  token: string;
}) {
  const [qrCode, setQrCode] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function generate() {
      try {
        const QRCodeModule = await import("qrcode");

        const baseUrl =
          typeof window !== "undefined" ? window.location.origin : "";

        const url = `${baseUrl}/ticket/verify?token=${encodeURIComponent(
          token,
        )}`;

        const dataUrl = await QRCodeModule.default.toDataURL(url, {
          width: 220,
          margin: 2,
          errorCorrectionLevel: "H",
          color: {
            dark: "#111827",
            light: "#FFFFFF",
          },
        });

        if (!cancelled) {
          setQrCode(dataUrl);
        }
      } catch (error) {
        console.error(
          `[SiloCamp] Impossible de générer le QR Code ${ticketNumber}:`,
          error,
        );

        if (!cancelled) {
          setFailed(true);
        }
      }
    }

    generate();

    return () => {
      cancelled = true;
    };
  }, [ticketNumber, token]);

  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gray-100 p-6 text-center text-sm text-red-500">
        QR Code indisponible
      </div>
    );
  }

  if (!qrCode) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gray-100">
        <span className="text-sm text-gray-500">Génération...</span>
      </div>
    );
  }

  return (
    <img
      src={qrCode}
      alt={`QR Code du billet ${ticketNumber}`}
      width={220}
      height={220}
      className="block h-[220px] w-[220px]"
      draggable={false}
    />
  );
}

function InvalidTicketPage({
  status,
  message,
}: {
  status: Exclude<VerificationStatus, "loading" | "valid" | "missing-token">;
  message?: string;
}) {
  const config = {
    used: {
      title: "Billet déjà utilisé",
      description:
        "Ce billet a déjà été contrôlé et enregistré comme utilisé. Il ne peut pas être présenté une seconde fois.",
      icon: AlertTriangle,
      color: "amber",
      badge: "Billet utilisé",
    },
    cancelled: {
      title: "Billet annulé",
      description:
        "Ce billet a été annulé et n'autorise plus l'accès au Camp International Silo 2026.",
      icon: XCircle,
      color: "red",
      badge: "Billet annulé",
    },
    "not-found": {
      title: "Billet introuvable",
      description:
        "Aucun billet correspondant à ce QR Code n'a été trouvé dans le système SiloCamp.",
      icon: XCircle,
      color: "red",
      badge: "Billet introuvable",
    },
    error: {
      title: "Vérification impossible",
      description:
        message ||
        "Une erreur est survenue pendant la vérification du billet. Veuillez réessayer.",
      icon: AlertTriangle,
      color: "red",
      badge: "Erreur de vérification",
    },
  } as const;

  const current = config[status];
  const Icon = current.icon;

  const isAmber = current.color === "amber";

  return (
    <main className="min-h-screen bg-ink-950 pb-24 pt-28 md:pt-32">
      <div className="container-px mx-auto max-w-2xl">
        <div className="overflow-hidden rounded-[2rem] border border-gold-400/15 bg-ink-900/60 shadow-2xl">
          <div className="border-b border-gold-400/10 bg-gold-400/5 p-8 text-center sm:p-10">
            <div
              className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
                isAmber
                  ? "bg-amber-400/10 text-amber-300"
                  : "bg-red-400/10 text-red-300"
              }`}
            >
              <Icon className="h-10 w-10" />
            </div>

            <div className="mt-6">
              <div
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] ${
                  isAmber
                    ? "border-amber-400/20 bg-amber-400/5 text-amber-300"
                    : "border-red-400/20 bg-red-400/5 text-red-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {current.badge}
              </div>
            </div>

            <h1 className="mt-6 text-3xl font-black tracking-tight text-cream sm:text-4xl">
              {current.title}
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-cream-dim sm:text-base">
              {current.description}
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <div className="rounded-2xl border border-gold-400/10 bg-ink-950/40 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold-300" />

                <div>
                  <p className="text-sm font-bold text-cream">
                    Vérification SiloCamp
                  </p>

                  <p className="mt-1 text-xs leading-6 text-cream-dim">
                    Si vous pensez qu'il s'agit d'une erreur, veuillez contacter
                    l'organisation du Camp avant de présenter ce billet à
                    l'entrée.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="btn-gold inline-flex flex-1 items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Réessayer
              </button>

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
    <main className="min-h-screen bg-ink-950 pb-24 pt-28 md:pt-32">
      <div className="container-px mx-auto max-w-2xl">
        <div className="overflow-hidden rounded-[2rem] border border-gold-400/15 bg-ink-900/60 shadow-2xl">
          <div className="border-b border-gold-400/10 bg-gold-400/5 p-8 text-center sm:p-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold-400/10 text-gold-300">
              <Ticket className="h-10 w-10" />
            </div>

            <h1 className="mt-6 text-3xl font-black tracking-tight text-cream sm:text-4xl">
              QR Code invalide
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-cream-dim sm:text-base">
              Aucun identifiant de vérification n'a été fourni avec ce lien.
              Veuillez utiliser le QR Code présent sur votre billet SiloCamp.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <div className="rounded-2xl border border-gold-400/10 bg-ink-950/40 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold-300" />

                <div>
                  <p className="text-sm font-bold text-cream">
                    Contrôle sécurisé
                  </p>

                  <p className="mt-1 text-xs leading-6 text-cream-dim">
                    Le lien de vérification doit contenir un jeton de sécurité
                    associé au billet.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
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
      </div>
    </main>
  );
}

export default function TicketVerify() {
  const [status, setStatus] = useState<VerificationStatus>("loading");

  const [ticket, setTicket] = useState<SiloCampTicket | null>(null);

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

        const result = (await verifyTicket(token)) as VerificationResult;

        if (cancelled) return;

        if (result.valid && result.ticket) {
          setTicket(result.ticket);
          setStatus("valid");
          return;
        }

        setTicket(null);
        setMessage(result.message || "");

        setStatus(normalizeStatus(result));
      } catch (error) {
        console.error(
          "[SiloCamp] Erreur lors de la vérification du billet :",
          error,
        );

        if (!cancelled) {
          setTicket(null);
          setMessage(
            "Impossible de contacter le service de vérification du billet.",
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
      <main className="min-h-screen bg-ink-950 pb-24 pt-28 md:pt-32">
        <div className="container-px mx-auto max-w-2xl">
          <div className="overflow-hidden rounded-[2rem] border border-gold-400/15 bg-ink-900/60 shadow-2xl">
            <div className="p-10 text-center sm:p-14">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold-400/10 text-gold-300">
                <RefreshCw className="h-9 w-9 animate-spin" />
              </div>

              <h1 className="mt-7 text-3xl font-black text-cream">
                Vérification du billet
              </h1>

              <p className="mt-4 text-sm leading-7 text-cream-dim">
                Nous vérifions l'authenticité de votre billet SiloCamp...
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
        status as Exclude<
          VerificationStatus,
          "loading" | "valid" | "missing-token"
        >
      }
      message={message}
    />
  );
}
