"use client";

import { useEffect, useRef, useState } from "react";

import {
  CheckCircle2,
  XCircle,
  Camera,
  User,
  Mail,
  Phone,
  Ticket as TicketIcon,
  Loader2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

import {
  markTicketAsUsed,
  verifyTicket,
  type Ticket,
} from "@/services/ticketService";

import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

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
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const [state, setState] = useState<ScanState>("idle");

  const [ticket, setTicket] = useState<Ticket | null>(null);

  const [message, setMessage] = useState("");

  const [busy, setBusy] = useState(false);

  /* =========================================================
     STOP SCANNER
     ========================================================= */

  async function stopScanner() {
    const scanner = scannerRef.current;

    if (!scanner) {
      return;
    }

    try {
      const scannerState = scanner.getState();

      /*
       * 2 = SCANNING
       * 3 = PAUSED
       */

      if (scannerState === 2 || scannerState === 3) {
        await scanner.stop();
      }
    } catch (error) {
      console.warn("[SiloCamp Scanner] Stop error", error);
    }

    try {
      scanner.clear();
    } catch (error) {
      console.warn("[SiloCamp Scanner] Clear error", error);
    }

    scannerRef.current = null;
  }

  /* =========================================================
     VERIFY QR
     ========================================================= */

  async function handleQRCode(decodedText: string) {
    await stopScanner();

    setState("verifying");

    setMessage("");

    try {
      const token = extractVerificationToken(decodedText);

      if (!token) {
        setState("error");

        setMessage(
          "QR Code SiloCamp invalide : token de vérification introuvable.",
        );

        return;
      }

      const result = await verifyTicket(token);

      if (result.ticket) {
        setTicket(result.ticket);
      }

      if (result.valid) {
        setState("valid");

        setMessage(result.message || "Billet valide.");

        return;
      }

      switch (result.reason) {
        case "USED":
        case "TICKET_ALREADY_USED":
          setState("used");

          setMessage(result.message || "Ce billet a déjà été utilisé.");

          break;

        case "CANCELLED":
        case "TICKET_CANCELLED":
          setState("cancelled");

          setMessage(result.message || "Ce billet a été annulé.");

          break;

        case "NOT_FOUND":
        case "TICKET_NOT_FOUND":
          setState("not-found");

          setMessage(result.message || "Billet introuvable.");

          break;

        default:
          setState("error");

          setMessage(result.message || "Impossible de vérifier ce billet.");
      }
    } catch (error) {
      console.error("[SiloCamp Scanner]", error);

      setState("error");

      setMessage(
        error instanceof Error
          ? error.message
          : "Impossible de contacter le serveur SiloCamp.",
      );
    }
  }

  /* =========================================================
     START SCANNER
     ========================================================= */

  async function startScanner() {
    setTicket(null);

    setMessage("");

    setState("scanning");

    try {
      await stopScanner();

      const scanner = new Html5Qrcode("silocamp-qr-reader", {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });

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
        async (decodedText) => {
          await handleQRCode(decodedText);
        },
        () => {
          /*
           * Les erreurs de scan image par image
           * sont normales et ne doivent pas
           * afficher une erreur à l'utilisateur.
           */
        },
      );
    } catch (error) {
      console.error("[SiloCamp Scanner Start]", error);

      await stopScanner();

      setState("error");

      setMessage(
        "Impossible d'accéder à la caméra. Vérifie les autorisations du navigateur.",
      );
    }
  }

  /* =========================================================
     CONFIRM ENTRY
     ========================================================= */

  async function confirmEntry() {
    if (!ticket) {
      return;
    }

    if (ticket.status !== "VALID") {
      return;
    }

    setBusy(true);

    try {
      const updatedTicket = await markTicketAsUsed(ticket.ticketNumber);

      setTicket(updatedTicket);

      setState("confirmed");

      setMessage("Billet validé. Le participant peut entrer.");
    } catch (error) {
      console.error("[SiloCamp Use Ticket]", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Impossible de valider le billet.",
      );
    } finally {
      setBusy(false);
    }
  }

  /* =========================================================
     RESET
     ========================================================= */

  async function resetScanner() {
    await stopScanner();

    setTicket(null);

    setMessage("");

    setState("idle");
  }

  /* =========================================================
     CLEANUP
     ========================================================= */

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, []);

  /* =========================================================
     PAGE
     ========================================================= */

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-8 pt-24 sm:px-6 sm:pt-28">
      <div className="mx-auto w-full max-w-lg">
        {/* HEADER */}
        <div className="mb-6 text-center text-white">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <TicketIcon className="h-7 w-7" strokeWidth={1.8} />
          </div>

          <h1 className="text-3xl font-black">SiloCamp</h1>

          <p className="mt-1 text-sm text-white/60">Contrôle des billets</p>
        </div>

        {/* =====================================================
        SCANNER
    ===================================================== */}
        {(state === "idle" || state === "scanning") && (
          <div className="overflow-hidden rounded-[30px] bg-white shadow-2xl">
            <div className="p-6">
              <div className="mb-5 text-center">
                <h2 className="text-xl font-black text-slate-900">
                  Scanner un billet
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Place le QR Code du billet devant la caméra.
                </p>
              </div>

              {/* CAMERA */}
              <div className="overflow-hidden rounded-3xl bg-slate-950">
                <div id="silocamp-qr-reader" className="min-h-[320px]" />
              </div>

              {state === "idle" ? (
                <button
                  type="button"
                  onClick={startScanner}
                  className="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 px-5 py-4 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  <Camera className="h-5 w-5" />
                  Ouvrir la caméra
                </button>
              ) : (
                <div className="mt-5 flex items-center justify-center gap-3 rounded-2xl bg-slate-100 px-5 py-4 text-sm font-semibold text-slate-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Recherche du QR Code...
                </div>
              )}
            </div>
          </div>
        )}

        {/* =====================================================
        VERIFYING
    ===================================================== */}
        {state === "verifying" && (
          <StatusCard
            icon={<Loader2 className="h-10 w-10 animate-spin text-blue-600" />}
            title="Vérification..."
            message="Recherche du billet dans la base de données SiloCamp."
            background="bg-blue-50"
          />
        )}

        {/* =====================================================
        VALID
    ===================================================== */}
        {state === "valid" && ticket && (
          <TicketResult
            ticket={ticket}
            status="valid"
            message={message}
            onConfirm={confirmEntry}
            onReset={resetScanner}
            busy={busy}
          />
        )}

        {/* =====================================================
        CONFIRMED
    ===================================================== */}
        {state === "confirmed" && ticket && (
          <TicketResult
            ticket={ticket}
            status="confirmed"
            message={message}
            onReset={resetScanner}
            busy={false}
          />
        )}

        {/* =====================================================
        USED
    ===================================================== */}
        {state === "used" && ticket && (
          <TicketResult
            ticket={ticket}
            status="used"
            message={message}
            onReset={resetScanner}
            busy={false}
          />
        )}

        {/* =====================================================
        CANCELLED
    ===================================================== */}
        {state === "cancelled" && ticket && (
          <TicketResult
            ticket={ticket}
            status="cancelled"
            message={message}
            onReset={resetScanner}
            busy={false}
          />
        )}

        {/* =====================================================
        NOT FOUND / ERROR
    ===================================================== */}
        {(state === "not-found" || state === "error") && (
          <StatusCard
            icon={
              state === "not-found" ? (
                <XCircle className="h-10 w-10 text-red-600" />
              ) : (
                <AlertTriangle className="h-10 w-10 text-red-600" />
              )
            }
            title={state === "not-found" ? "Billet introuvable" : "Erreur"}
            message={message || "Impossible de vérifier ce billet."}
            background="bg-red-50"
            action={
              <button
                type="button"
                onClick={resetScanner}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-sm font-bold text-white"
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

/* =========================================================
   EXTRACT TOKEN
   ========================================================= */

function extractVerificationToken(value: string): string | null {
  const text = value.trim();

  if (!text) {
    return null;
  }

  /*
   * Cas 1 :
   * QR Code contenant directement le token.
   */

  if (!text.startsWith("http://") && !text.startsWith("https://")) {
    return text;
  }

  /*
   * Cas 2 :
   * QR Code contenant :
   * https://silocamp.../ticket/verify?token=XXXX
   */

  try {
    const url = new URL(text);

    const token = url.searchParams.get("token");

    return token?.trim() || null;
  } catch {
    return null;
  }
}

/* =========================================================
   STATUS CARD
   ========================================================= */

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
      <div className="p-8 text-center">
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${background}`}
        >
          {icon}
        </div>

        <h2 className="mt-5 text-2xl font-black text-slate-900">{title}</h2>

        <p className="mt-3 text-sm leading-6 text-slate-500">{message}</p>

        {action}
      </div>
    </div>
  );
}

/* =========================================================
   TICKET RESULT
   ========================================================= */

function TicketResult({
  ticket,
  status,
  message,
  onConfirm,
  onReset,
  busy,
}: {
  ticket: Ticket;
  status: "valid" | "confirmed" | "used" | "cancelled";
  message: string;
  onConfirm?: () => void;
  onReset: () => void;
  busy: boolean;
}) {
  const isValid = status === "valid";

  const isConfirmed = status === "confirmed";

  const isUsed = status === "used";

  const isCancelled = status === "cancelled";

  const statusTitle = isConfirmed
    ? "ENTRÉE VALIDÉE"
    : isValid
      ? "BILLET VALIDE"
      : isUsed
        ? "BILLET DÉJÀ UTILISÉ"
        : "BILLET ANNULÉ";

  const statusBackground =
    isConfirmed || isValid
      ? "bg-emerald-500"
      : isUsed
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="overflow-hidden rounded-[30px] bg-white shadow-2xl">
      {/* STATUS */}

      <div className={`px-6 py-8 text-center ${statusBackground}`}>
        {isConfirmed || isValid ? (
          <CheckCircle2 className="mx-auto h-14 w-14 text-white" />
        ) : (
          <XCircle className="mx-auto h-14 w-14 text-white" />
        )}

        <h2 className="mt-4 text-2xl font-black text-white">{statusTitle}</h2>

        <p className="mt-2 text-sm leading-6 text-white/85">{message}</p>
      </div>

      {/* TICKET */}

      <div className="p-6">
        <div className="mb-6 rounded-2xl bg-slate-50 p-5 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Numéro du billet
          </p>

          <p className="mt-2 break-all text-xl font-black text-slate-900">
            {ticket.ticketNumber}
          </p>
        </div>

        <div className="space-y-4">
          <InfoRow
            icon={<User className="h-4 w-4" />}
            label="Participant"
            value={ticket.participantName}
          />

          <InfoRow
            icon={<User className="h-4 w-4" />}
            label="Prénom"
            value={ticket.firstName || "—"}
          />

          <InfoRow
            icon={<User className="h-4 w-4" />}
            label="Nom"
            value={ticket.lastName || "—"}
          />

          <InfoRow
            icon={<Phone className="h-4 w-4" />}
            label="Téléphone"
            value={ticket.phone || "—"}
          />

          <InfoRow
            icon={<Mail className="h-4 w-4" />}
            label="E-mail"
            value={ticket.email}
          />

          <InfoRow
            icon={<TicketIcon className="h-4 w-4" />}
            label="Événement"
            value={ticket.eventTitle}
          />
        </div>

        {/* CONFIRM */}

        {isValid && !isConfirmed && !isUsed && !isCancelled && (
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="mt-7 flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Validation...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                Valider l'entrée
              </>
            )}
          </button>
        )}

        {/* RESET */}

        <button
          type="button"
          onClick={onReset}
          disabled={busy}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-4 text-sm font-bold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
        >
          <RotateCcw className="h-5 w-5" />
          Scanner un autre billet
        </button>
      </div>
    </div>
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
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-400">{label}</p>

        <p className="mt-0.5 break-words text-sm font-semibold text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}
