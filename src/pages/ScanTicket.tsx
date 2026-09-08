"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AlertTriangle,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  ShieldCheck,
  Ticket as TicketIcon,
  User,
  XCircle,
} from "lucide-react";

import {
  markTicketAsUsed,
  verifyTicket,
  type Ticket,
} from "@/services/ticketService";

import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";

type ScanState =
  | "idle"
  | "scanning"
  | "verifying"
  | "valid"
  | "used"
  | "cancelled"
  | "not-found"
  | "error"
  | "confirmed";

export default function ScanTicket() {
  const scannerRef =
    useRef<Html5Qrcode | null>(null);

  const processingRef =
    useRef(false);

  const [state, setState] =
    useState<ScanState>("idle");

  const [ticket, setTicket] =
    useState<Ticket | null>(null);

  const [message, setMessage] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  async function stopScanner() {
    const scanner = scannerRef.current;

    if (!scanner) {
      return;
    }

    try {
      const scannerState =
        scanner.getState();

      if (
        scannerState === 2 ||
        scannerState === 3
      ) {
        await scanner.stop();
      }
    } catch (error) {
      console.warn(
        "[SiloCamp Scanner] Stop error",
        error,
      );
    }

    try {
      scanner.clear();
    } catch (error) {
      console.warn(
        "[SiloCamp Scanner] Clear error",
        error,
      );
    }

    scannerRef.current = null;
  }

  async function handleQRCode(
    decodedText: string,
  ) {
    if (processingRef.current) {
      return;
    }

    processingRef.current = true;

    await stopScanner();

    setState("verifying");
    setMessage("");
    setTicket(null);

    try {
      const token =
        extractVerificationToken(
          decodedText,
        );

      if (!token) {
        setState("error");

        setMessage(
          "QR Code SiloCamp invalide : token de vérification introuvable.",
        );

        return;
      }

      const result =
        await verifyTicket(token);

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
        case "TICKET_ALREADY_USED":
        case "USED":
          setState("used");

          setMessage(
            result.message ||
              "Ce billet a déjà été utilisé.",
          );

          break;

        case "TICKET_CANCELLED":
        case "CANCELLED":
          setState("cancelled");

          setMessage(
            result.message ||
              "Ce billet a été annulé.",
          );

          break;

        case "TICKET_NOT_FOUND":
        case "NOT_FOUND":
          setState("not-found");

          setMessage(
            result.message ||
              "Billet introuvable.",
          );

          break;

        case "SCAN_UNAUTHORIZED":
          setState("error");

          setMessage(
            "Votre session de contrôle a expiré. Veuillez vous reconnecter.",
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
      console.error(
        "[SiloCamp Scanner]",
        error,
      );

      setState("error");

      setMessage(
        error instanceof Error
          ? error.message
          : "Impossible de contacter le serveur SiloCamp.",
      );
    } finally {
      processingRef.current = false;
    }
  }

  async function startScanner() {
    if (processingRef.current) {
      return;
    }

    setTicket(null);
    setMessage("");
    setState("scanning");

    try {
      await stopScanner();

      const scanner =
        new Html5Qrcode(
          "silocamp-qr-reader",
          {
            formatsToSupport: [
              Html5QrcodeSupportedFormats.QR_CODE,
            ],
            verbose: false,
          },
        );

      scannerRef.current = scanner;

      await scanner.start(
        {
          facingMode: {
            exact: "environment",
          },
        },
        {
          fps: 10,
          qrbox: {
            width: 260,
            height: 260,
          },
          aspectRatio: 1,
        },
        async (
          decodedText,
        ) => {
          await handleQRCode(
            decodedText,
          );
        },
        () => {},
      );
    } catch (error) {
      console.error(
        "[SiloCamp Scanner Start]",
        error,
      );

      await stopScanner();

      setState("error");

      setMessage(
        "Impossible d'accéder à la caméra. Vérifie les autorisations du navigateur.",
      );
    }
  }

  async function confirmEntry() {
    if (!ticket) {
      return;
    }

    if (
      ticket.status !== "VALID" ||
      busy
    ) {
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const updatedTicket =
        await markTicketAsUsed(
          ticket.ticketNumber,
        );

      setTicket(updatedTicket);

      setState("confirmed");

      setMessage(
        "Le billet a été validé avec succès. Le participant peut entrer.",
      );
    } catch (error) {
      console.error(
        "[SiloCamp Validate Ticket]",
        error,
      );

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Impossible de valider le billet.";

      setMessage(errorMessage);

      if (
        errorMessage
          .toLowerCase()
          .includes("déjà été utilisé")
      ) {
        setState("used");
      }
    } finally {
      setBusy(false);
    }
  }

  async function resetScanner() {
    await stopScanner();

    processingRef.current = false;

    setTicket(null);
    setMessage("");
    setBusy(false);
    setState("idle");
  }

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-xl">
        <header className="mb-7 text-center text-white">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
            <ShieldCheck className="h-8 w-8" />
          </div>

          <h1 className="text-3xl font-black tracking-tight">
            SiloCamp
          </h1>

          <p className="mt-1 text-sm font-medium text-white/55">
            Contrôle des billets
          </p>
        </header>

        {(state === "idle" ||
          state === "scanning") && (
          <div className="overflow-hidden rounded-[30px] bg-white shadow-2xl">
            <div className="p-5 sm:p-7">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                  <TicketIcon className="h-6 w-6 text-slate-700" />
                </div>

                <h2 className="text-xl font-black text-slate-900">
                  Scanner un billet
                </h2>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Place le QR Code du billet devant la caméra pour vérifier son authenticité.
                </p>
              </div>

              <div className="overflow-hidden rounded-[26px] bg-slate-950">
                <div
                  id="silocamp-qr-reader"
                  className="min-h-[320px]"
                />
              </div>

              {state === "idle" ? (
                <button
                  type="button"
                  onClick={startScanner}
                  className="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 px-5 py-4 text-sm font-black text-white transition hover:bg-slate-800 active:scale-[0.99]"
                >
                  <Camera className="h-5 w-5" />
                  Ouvrir la caméra
                </button>
              ) : (
                <div className="mt-5 flex items-center justify-center gap-3 rounded-2xl bg-slate-100 px-5 py-4 text-sm font-bold text-slate-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Recherche du QR Code...
                </div>
              )}

              <div className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
                <ShieldCheck className="h-4 w-4" />
                Vérification sécurisée SiloCamp
              </div>
            </div>
          </div>
        )}

        {state === "verifying" && (
          <StatusCard
            icon={
              <Loader2 className="h-11 w-11 animate-spin text-blue-600" />
            }
            title="Vérification en cours"
            message="Nous vérifions ce billet auprès du serveur SiloCamp."
            background="bg-blue-50"
          />
        )}

        {state === "valid" &&
          ticket && (
            <TicketResult
              ticket={ticket}
              status="valid"
              message={message}
              onConfirm={confirmEntry}
              onReset={resetScanner}
              busy={busy}
            />
          )}

        {state === "confirmed" &&
          ticket && (
            <TicketResult
              ticket={ticket}
              status="confirmed"
              message={message}
              onReset={resetScanner}
              busy={false}
            />
          )}

        {state === "used" &&
          ticket && (
            <TicketResult
              ticket={ticket}
              status="used"
              message={message}
              onReset={resetScanner}
              busy={false}
            />
          )}

        {state === "cancelled" &&
          ticket && (
            <TicketResult
              ticket={ticket}
              status="cancelled"
              message={message}
              onReset={resetScanner}
              busy={false}
            />
          )}

        {(state === "not-found" ||
          state === "error") && (
          <StatusCard
            icon={
              state === "not-found" ? (
                <XCircle className="h-11 w-11 text-red-600" />
              ) : (
                <AlertTriangle className="h-11 w-11 text-red-600" />
              )
            }
            title={
              state === "not-found"
                ? "Billet introuvable"
                : "Une erreur est survenue"
            }
            message={
              message ||
              "Impossible de vérifier ce billet."
            }
            background="bg-red-50"
            action={
              <button
                type="button"
                onClick={resetScanner}
                className="mt-7 flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 px-5 py-4 text-sm font-black text-white transition hover:bg-slate-800"
              >
                <RotateCcw className="h-5 w-5" />
                Scanner un autre billet
              </button>
            }
          />
        )}
      </div>
    </main>
  );
}

function extractVerificationToken(
  value: string,
): string | null {
  const text = value.trim();

  if (!text) {
    return null;
  }

  if (
    !text.startsWith("http://") &&
    !text.startsWith("https://")
  ) {
    return text;
  }

  try {
    const url = new URL(text);

    const token =
      url.searchParams.get("token");

    return token?.trim() || null;
  } catch {
    return null;
  }
}

function StatusCard({
  icon,
  title,
  message,
  background,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  background: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[30px] bg-white shadow-2xl">
      <div className="p-8 text-center sm:p-10">
        <div
          className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full ${background}`}
        >
          {icon}
        </div>

        <h2 className="mt-6 text-2xl font-black text-slate-900">
          {title}
        </h2>

        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
          {message}
        </p>

        {action}
      </div>
    </div>
  );
}

function TicketResult({
  ticket,
  status,
  message,
  onConfirm,
  onReset,
  busy,
}: {
  ticket: Ticket;
  status:
    | "valid"
    | "confirmed"
    | "used"
    | "cancelled";
  message: string;
  onConfirm?: () => void;
  onReset: () => void;
  busy: boolean;
}) {
  const isValid =
    status === "valid";

  const isConfirmed =
    status === "confirmed";

  const isUsed =
    status === "used";

  const isCancelled =
    status === "cancelled";

  const statusTitle =
    isConfirmed
      ? "ENTRÉE VALIDÉE"
      : isValid
        ? "BILLET VALIDE"
        : isUsed
          ? "BILLET DÉJÀ UTILISÉ"
          : "BILLET ANNULÉ";

  const statusDescription =
    isConfirmed
      ? "Le participant est autorisé à entrer."
      : isValid
        ? "Ce billet est authentique et peut être validé."
        : isUsed
          ? "Ce billet a déjà été présenté à l'entrée."
          : "Ce billet n'est plus valable.";

  const statusBackground =
    isConfirmed || isValid
      ? "bg-emerald-600"
      : isUsed
        ? "bg-amber-500"
        : "bg-red-600";

  return (
    <div className="overflow-hidden rounded-[30px] bg-white shadow-2xl">
      <div
        className={`px-6 py-9 text-center text-white ${statusBackground}`}
      >
        {isConfirmed || isValid ? (
          <CheckCircle2 className="mx-auto h-16 w-16" />
        ) : (
          <XCircle className="mx-auto h-16 w-16" />
        )}

        <h2 className="mt-5 text-2xl font-black tracking-tight sm:text-3xl">
          {statusTitle}
        </h2>

        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/85">
          {message || statusDescription}
        </p>

        {isValid && (
          <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-bold text-white">
            <ShieldCheck className="h-4 w-4" />
            Vérification réussie
          </div>
        )}
      </div>

      <div className="p-5 sm:p-7">
        <div className="mb-6 rounded-2xl border border-slate-100 bg-slate-50 p-5 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            Numéro du billet
          </p>

          <p className="mt-2 break-all font-mono text-xl font-black text-slate-900">
            {ticket.ticketNumber}
          </p>
        </div>

        <div className="space-y-3">
          <InfoRow
            icon={
              <User className="h-4 w-4" />
            }
            label="Participant"
            value={
              ticket.participantName ||
              [
                ticket.firstName,
                ticket.lastName,
              ]
                .filter(Boolean)
                .join(" ") ||
              "—"
            }
          />

          <InfoRow
            icon={
              <Mail className="h-4 w-4" />
            }
            label="E-mail"
            value={ticket.email || "—"}
          />

          <InfoRow
            icon={
              <Phone className="h-4 w-4" />
            }
            label="Téléphone"
            value={ticket.phone || "—"}
          />

          <InfoRow
            icon={
              <TicketIcon className="h-4 w-4" />
            }
            label="Événement"
            value={
              ticket.eventTitle || "—"
            }
          />

          <InfoRow
            icon={
              <CalendarDays className="h-4 w-4" />
            }
            label="Date"
            value={
              ticket.dateLabel || "—"
            }
          />

          <InfoRow
            icon={
              <Clock3 className="h-4 w-4" />
            }
            label="Heure"
            value={ticket.time || "—"}
          />

          <InfoRow
            icon={
              <MapPin className="h-4 w-4" />
            }
            label="Lieu"
            value={[
              ticket.venue,
              ticket.city,
            ]
              .filter(Boolean)
              .join(" — ") || "—"}
          />

          {ticket.reservationId && (
            <InfoRow
              icon={
                <ShieldCheck className="h-4 w-4" />
              }
              label="Réservation"
              value={
                ticket.reservationId
              }
            />
          )}
        </div>

        {isValid && (
          <div className="mt-7 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

              <div>
                <p className="text-sm font-black text-emerald-900">
                  Prêt pour l'entrée
                </p>

                <p className="mt-1 text-xs leading-5 text-emerald-700">
                  Vérifie rapidement les informations du participant avant de confirmer son accès.
                </p>
              </div>
            </div>
          </div>
        )}

        {isValid &&
          !isConfirmed &&
          !isUsed &&
          !isCancelled && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className="mt-6 flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-5 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Validation en cours...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-6 w-6" />
                  Valider l'entrée
                </>
              )}
            </button>
          )}

        {isConfirmed && (
          <div className="mt-6 rounded-2xl bg-emerald-50 p-5 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>

            <p className="mt-3 text-sm font-black text-emerald-900">
              Accès confirmé
            </p>

            <p className="mt-1 text-xs text-emerald-700">
              Le participant peut entrer dans l'événement.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={onReset}
          disabled={busy}
          className="mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcw className="h-5 w-5" />
          Scanner un autre billet
        </button>
      </div>
    </div>
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
    <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-bold text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}