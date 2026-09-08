import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { verifyTicket } from "@/services/ticketService";

type VerifyState =
  | "loading"
  | "valid"
  | "used"
  | "cancelled"
  | "not-found"
  | "error"
  | "missing-token";

type VerifyResult = {
  valid?: boolean;
  ticket?: unknown;
  reason?: string;
  message?: string;
};

function normalizeReason(reason?: string) {
  return (reason ?? "").toUpperCase();
}

function ValidTicketPage() {
  return (
    <main className="min-h-screen bg-ink-950 px-4 py-24 text-cream sm:px-6">
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-[2rem] border border-gold-400/10 bg-ink-900/60 shadow-2xl shadow-black/20">
          <div className="px-6 py-10 text-center sm:px-10 sm:py-14">
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10">
              <CheckCircle2
                className="h-10 w-10 text-emerald-400"
                strokeWidth={1.8}
              />
            </div>

            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-gold-300">
              Billet valide
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-cream sm:text-4xl">
              Accès confirmé
            </h1>

            <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-cream-dim sm:text-base">
              Votre billet a été vérifié avec succès et votre accès au
              <span className="font-medium text-cream">
                {" "}
                Camp International Silo 2026
              </span>{" "}
              est confirmé.
            </p>

            <div className="my-9 h-px bg-gold-400/10" />

            <div className="space-y-1">
              <p className="text-lg font-semibold tracking-[0.18em] text-gold-300">
                SILO CAMP
              </p>

              <p className="text-sm text-cream-dim">
                Camp International Silo 2026
              </p>
            </div>

            <div className="mt-9 rounded-2xl border border-emerald-400/10 bg-emerald-400/5 px-5 py-4">
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                Accès confirmé
              </div>

              <p className="mt-2 text-xs leading-6 text-cream-dim">
                Ce billet est actuellement valide. Présentez simplement votre
                billet à l'équipe d'accueil lors de votre arrivée.
              </p>
            </div>

            <Link
              to="/"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold-400 px-6 py-3.5 text-sm font-semibold text-ink-950 transition-all duration-200 hover:bg-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:ring-offset-2 focus:ring-offset-ink-900"
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

function InvalidTicketPage({
  state,
  message,
}: {
  state: Exclude<VerifyState, "loading" | "valid" | "missing-token">;
  message?: string;
}) {
  const config = {
    used: {
      icon: CheckCircle2,
      title: "Billet déjà utilisé",
      text:
        message ||
        "Ce billet a déjà été contrôlé et utilisé. Il ne peut plus être présenté comme un accès valide.",
      iconClass: "text-amber-400",
      iconBg: "bg-amber-400/10",
      iconBorder: "border-amber-400/20",
      textClass: "text-amber-300",
    },
    cancelled: {
      icon: XCircle,
      title: "Billet annulé",
      text:
        message ||
        "Ce billet a été annulé et ne permet plus l'accès au Camp International Silo 2026.",
      iconClass: "text-red-400",
      iconBg: "bg-red-400/10",
      iconBorder: "border-red-400/20",
      textClass: "text-red-300",
    },
    "not-found": {
      icon: XCircle,
      title: "Billet introuvable",
      text:
        message ||
        "Ce billet n'a pas pu être retrouvé. Vérifiez que le lien utilisé est correct.",
      iconClass: "text-red-400",
      iconBg: "bg-red-400/10",
      iconBorder: "border-red-400/20",
      textClass: "text-red-300",
    },
    error: {
      icon: AlertTriangle,
      title: "Vérification impossible",
      text:
        message ||
        "Une erreur est survenue pendant la vérification du billet. Veuillez réessayer.",
      iconClass: "text-amber-400",
      iconBg: "bg-amber-400/10",
      iconBorder: "border-amber-400/20",
      textClass: "text-amber-300",
    },
  } as const;

  const current = config[state] ?? config.error;
  const Icon = current.icon;

  return (
    <main className="min-h-screen bg-ink-950 px-4 py-24 text-cream sm:px-6">
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-[2rem] border border-gold-400/10 bg-ink-900/60 shadow-2xl shadow-black/20">
          <div className="px-6 py-10 text-center sm:px-10 sm:py-14">
            <div
              className={`mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border ${current.iconBorder} ${current.iconBg}`}
            >
              <Icon
                className={`h-10 w-10 ${current.iconClass}`}
                strokeWidth={1.8}
              />
            </div>

            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-gold-300">
              Billet
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-cream sm:text-4xl">
              {current.title}
            </h1>

            <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-cream-dim sm:text-base">
              {current.text}
            </p>

            <div className="my-9 h-px bg-gold-400/10" />

            <div className="space-y-1">
              <p className="text-lg font-semibold tracking-[0.18em] text-gold-300">
                SILO CAMP
              </p>

              <p className="text-sm text-cream-dim">
                Camp International Silo 2026
              </p>
            </div>

            <Link
              to="/"
              className="mt-9 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold-400 px-6 py-3.5 text-sm font-semibold text-ink-950 transition-all duration-200 hover:bg-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:ring-offset-2 focus:ring-offset-ink-900"
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

function MissingTokenPage() {
  return (
    <main className="min-h-screen bg-ink-950 px-4 py-24 text-cream sm:px-6">
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-[2rem] border border-gold-400/10 bg-ink-900/60 shadow-2xl shadow-black/20">
          <div className="px-6 py-10 text-center sm:px-10 sm:py-14">
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-amber-400/20 bg-amber-400/10">
              <AlertTriangle
                className="h-10 w-10 text-amber-400"
                strokeWidth={1.8}
              />
            </div>

            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-gold-300">
              Vérification
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-cream sm:text-4xl">
              Lien invalide
            </h1>

            <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-cream-dim sm:text-base">
              Aucun identifiant de vérification n'a été fourni avec ce lien.
            </p>

            <Link
              to="/"
              className="mt-9 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold-400 px-6 py-3.5 text-sm font-semibold text-ink-950 transition-all duration-200 hover:bg-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:ring-offset-2 focus:ring-offset-ink-900"
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
  const [state, setState] = useState<VerifyState>("loading");
  const [message, setMessage] = useState("");

  async function checkTicket(token: string) {
    try {
      setState("loading");
      setMessage("");

      const result = (await verifyTicket(token)) as VerifyResult;

      if (result?.valid) {
        setState("valid");
        return;
      }

      const reason = normalizeReason(result?.reason);

      if (
        reason === "TICKET_ALREADY_USED" ||
        reason === "ALREADY_USED" ||
        reason === "USED"
      ) {
        setState("used");
        setMessage(result?.message || "");
        return;
      }

      if (reason === "TICKET_CANCELLED" || reason === "CANCELLED") {
        setState("cancelled");
        setMessage(result?.message || "");
        return;
      }

      if (reason === "TICKET_NOT_FOUND" || reason === "NOT_FOUND") {
        setState("not-found");
        setMessage(result?.message || "");
        return;
      }

      setState("error");
      setMessage(result?.message || "Le billet n'a pas pu être validé.");
    } catch (error) {
      console.error("[SiloCamp] Erreur de vérification du billet :", error);

      setState("error");
      setMessage(
        "Une erreur est survenue pendant la vérification du billet. Veuillez réessayer.",
      );
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token")?.trim();

    if (!token) {
      setState("missing-token");
      return;
    }

    checkTicket(token);
  }, []);

  if (state === "loading") {
    return (
      <main className="min-h-screen bg-ink-950 px-4 py-24 text-cream sm:px-6">
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
          <div className="w-full overflow-hidden rounded-[2rem] border border-gold-400/10 bg-ink-900/60 px-6 py-14 text-center shadow-2xl shadow-black/20 sm:px-10">
            <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-full border border-gold-400/10 bg-gold-400/5">
              <RefreshCw className="h-7 w-7 animate-spin text-gold-300" />
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-300">
              Silo Camp
            </p>

            <h1 className="mt-4 text-2xl font-semibold text-cream">
              Vérification du billet
            </h1>

            <p className="mt-3 text-sm text-cream-dim">Veuillez patienter...</p>
          </div>
        </div>
      </main>
    );
  }

  if (state === "valid") {
    return <ValidTicketPage />;
  }

  if (state === "missing-token") {
    return <MissingTokenPage />;
  }

  return <InvalidTicketPage state={state} message={message} />;
}
