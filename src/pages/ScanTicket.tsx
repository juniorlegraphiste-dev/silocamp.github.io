/**
 * =========================================================
 * SCAN TICKET — SILOCAMP
 * =========================================================
 *
 * Scanner QR Code pour le contrôle d'accès.
 *
 * Fonctionnement :
 *
 * - Ouverture de la caméra
 * - Lecture automatique du QR Code
 * - Extraction du numéro de billet
 * - Vérification via validateTicket()
 * - Affichage du participant
 * - Validation automatique du billet
 * - Passage du billet VALID → USED
 *
 * IMPORTANT :
 * Cette version fonctionne avec le ticketService utilisant
 * localStorage.
 *
 * En production, la validation devra être effectuée
 * côté serveur.
 * =========================================================
 */

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Ticket,
  User,
  XCircle,
} from "lucide-react";

import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

import {
  validateTicket,
  useTicket,
  type Ticket as SiloTicket,
} from "@/services/ticketService";

/* =========================================================
   TYPES
========================================================= */

type ScanStatus =
  | "idle"
  | "scanning"
  | "validating"
  | "valid"
  | "invalid"
  | "error";

/* =========================================================
   CONSTANTES
========================================================= */

const SCANNER_ID = "silocamp-qr-reader";

/* =========================================================
   COMPONENT
========================================================= */

export default function ScanTicket() {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const processingRef = useRef(false);

  const [status, setStatus] = useState<ScanStatus>("idle");

  const [message, setMessage] = useState("");

  const [ticket, setTicket] = useState<SiloTicket | null>(null);

  const [cameraError, setCameraError] = useState("");

  /* =======================================================
     ARRÊTER LE SCANNER
  ======================================================= */

  const stopScanner = async () => {
    const scanner = scannerRef.current;

    if (!scanner) {
      return;
    }

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch (error) {
      console.warn("[SiloCamp] Impossible d'arrêter le scanner :", error);
    }

    try {
      scanner.clear();
    } catch (error) {
      console.warn("[SiloCamp] Impossible de nettoyer le scanner :", error);
    }

    scannerRef.current = null;
  };

  /* =======================================================
     TRAITEMENT QR CODE
  ======================================================= */

  const handleScan = async (decodedText: string) => {
    if (processingRef.current) {
      return;
    }

    processingRef.current = true;

    setStatus("validating");

    setMessage("Vérification du billet...");

    await stopScanner();

    /* =====================================================
       NETTOYAGE DU QR CODE
    ===================================================== */

    const ticketNumber = decodedText.trim();

    if (!ticketNumber) {
      setStatus("invalid");

      setMessage("Le QR Code ne contient aucun numéro de billet.");

      processingRef.current = false;

      return;
    }

    /* =====================================================
       VALIDATION
    ===================================================== */

    try {
      const result = validateTicket(ticketNumber);

      /* ===================================================
         BILLET INVALIDE
      =================================================== */

      if (!result.valid || !result.ticket) {
        setTicket(result.ticket);

        setStatus("invalid");

        setMessage(result.message);

        processingRef.current = false;

        return;
      }

      /* ===================================================
         BILLET VALIDE
      =================================================== */

      const ticketToUse = result.ticket;

      setTicket(ticketToUse);

      /* ===================================================
         MARQUER LE BILLET COMME UTILISÉ
      =================================================== */

      const used = useTicket(ticketToUse.id);

      if (!used) {
        setStatus("invalid");

        setMessage(
          "Le billet est valide, mais son utilisation n'a pas pu être enregistrée.",
        );

        processingRef.current = false;

        return;
      }

      /* ===================================================
         SUCCÈS
      =================================================== */

      setStatus("valid");

      setMessage("Billet validé avec succès. Accès autorisé.");
    } catch (error) {
      console.error(
        "[SiloCamp] Erreur lors de la validation du billet :",
        error,
      );

      setStatus("error");

      setMessage(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de la validation.",
      );
    }

    processingRef.current = false;
  };

  /* =======================================================
     DÉMARRER LE SCANNER
  ======================================================= */

  const startScanner = async () => {
    if (scannerRef.current) {
      return;
    }

    setStatus("scanning");

    setMessage("Recherche d'un QR Code...");

    setTicket(null);

    setCameraError("");

    processingRef.current = false;

    try {
      const scanner = new Html5Qrcode(SCANNER_ID, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });

      scannerRef.current = scanner;

      await scanner.start(
        {
          facingMode: "environment",
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
          await handleScan(decodedText);
        },
        () => {
          /**
           * Les erreurs de lecture normales sont ignorées.
           *
           * html5-qrcode appelle cette fonction lorsqu'aucun
           * QR Code n'est détecté sur une frame.
           */
        },
      );
    } catch (error) {
      console.error("[SiloCamp] Erreur caméra :", error);

      await stopScanner();

      setStatus("error");

      setCameraError(
        "Impossible d'accéder à la caméra. Vérifiez les autorisations de votre navigateur.",
      );

      setMessage("La caméra n'a pas pu être démarrée.");
    }
  };

  /* =======================================================
     RESET
  ======================================================= */

  const resetScanner = async () => {
    await stopScanner();

    setStatus("idle");

    setMessage("");

    setTicket(null);

    setCameraError("");

    processingRef.current = false;
  };

  /* =======================================================
     DÉMARRAGE AUTOMATIQUE
  ======================================================= */

  useEffect(() => {
    startScanner();

    return () => {
      void stopScanner();
    };
  }, []);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="container-px mx-auto max-w-5xl pb-24 pt-28 md:pt-32">
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="mb-10">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-cream-dim transition hover:text-gold-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>

        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/20 bg-gold-400/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-gold-300">
            <ScanLine className="h-4 w-4" />
            Contrôle d'accès
          </span>

          <h1 className="mt-5 font-display text-4xl font-medium text-cream sm:text-5xl">
            Scanner un <span className="text-gold-gradient">billet</span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-cream-dim sm:text-base">
            Scannez le QR Code présent sur l'e-billet du participant pour
            vérifier automatiquement son accès.
          </p>
        </div>
      </div>

      {/* ===================================================
          SCANNER
      =================================================== */}

      {(status === "idle" ||
        status === "scanning" ||
        status === "validating") && (
        <div className="mx-auto max-w-2xl">
          <div className="overflow-hidden rounded-3xl border border-gold-400/15 bg-ink-900/50 shadow-2xl">
            {/* Scanner header */}

            <div className="border-b border-gold-400/10 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-400/10 text-gold-300">
                  <Camera className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-display text-xl text-cream">
                    Scanner le QR Code
                  </h2>

                  <p className="mt-1 text-xs text-cream-faint">
                    Placez le QR Code dans le cadre
                  </p>
                </div>
              </div>
            </div>

            {/* Camera */}

            <div className="relative bg-black">
              <div
                id={SCANNER_ID}
                className="min-h-[320px] w-full overflow-hidden sm:min-h-[420px]"
              />

              {/* Overlay */}

              {status === "scanning" && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative h-[260px] w-[260px]">
                    {/* Corners */}

                    <span className="absolute left-0 top-0 h-12 w-12 rounded-tl-2xl border-l-4 border-t-4 border-gold-400" />

                    <span className="absolute right-0 top-0 h-12 w-12 rounded-tr-2xl border-r-4 border-t-4 border-gold-400" />

                    <span className="absolute bottom-0 left-0 h-12 w-12 rounded-bl-2xl border-b-4 border-l-4 border-gold-400" />

                    <span className="absolute bottom-0 right-0 h-12 w-12 rounded-br-2xl border-b-4 border-r-4 border-gold-400" />

                    {/* Scan line */}

                    <div className="absolute left-4 right-4 top-1/2 h-0.5 animate-pulse bg-gold-400 shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                  </div>
                </div>
              )}
            </div>

            {/* Status */}

            <div className="p-5 text-center sm:p-6">
              <div className="flex items-center justify-center gap-2">
                {status === "scanning" && (
                  <>
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />

                    <span className="text-sm text-cream-dim">
                      Caméra active
                    </span>
                  </>
                )}

                {status === "validating" && (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />

                    <span className="text-sm text-gold-300">
                      Vérification...
                    </span>
                  </>
                )}
              </div>

              {message && (
                <p className="mt-3 text-sm text-cream-dim">{message}</p>
              )}

              {cameraError && (
                <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/5 p-4">
                  <p className="text-sm text-red-300">{cameraError}</p>
                </div>
              )}

              <button
                type="button"
                onClick={resetScanner}
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-gold-400/20 px-5 py-2.5 text-sm text-cream transition hover:border-gold-400/40 hover:bg-gold-400/5"
              >
                <RefreshCw className="h-4 w-4" />
                Réinitialiser
              </button>
            </div>
          </div>

          {/* Instructions */}

          <div className="mt-6 rounded-2xl border border-gold-400/10 bg-ink-900/30 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold-300" />

              <div>
                <h3 className="font-medium text-cream">Contrôle sécurisé</h3>

                <p className="mt-1 text-sm leading-relaxed text-cream-dim">
                  Chaque billet ne peut être utilisé qu'une seule fois. Après
                  validation, son statut passe automatiquement à « utilisé ».
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          BILLET VALIDE
      =================================================== */}

      {status === "valid" && ticket && (
        <ValidTicket ticket={ticket} onScanAnother={resetScanner} />
      )}

      {/* ===================================================
          BILLET INVALIDE
      =================================================== */}

      {status === "invalid" && (
        <InvalidTicket
          ticket={ticket}
          message={message}
          onScanAnother={resetScanner}
        />
      )}

      {/* ===================================================
          ERREUR
      =================================================== */}

      {status === "error" && (
        <ErrorState message={message} onRetry={resetScanner} />
      )}
    </main>
  );
}

/* =========================================================
   VALID TICKET
========================================================= */

function ValidTicket({
  ticket,
  onScanAnother,
}: {
  ticket: SiloTicket;
  onScanAnother: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="overflow-hidden rounded-3xl border border-emerald-400/20 bg-emerald-400/5">
        {/* Header */}

        <div className="border-b border-emerald-400/15 p-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
            <CheckCircle2 className="h-11 w-11" />
          </div>

          <h2 className="mt-6 font-display text-3xl text-cream">
            Accès autorisé
          </h2>

          <p className="mt-2 text-sm text-emerald-300">
            Billet valide et enregistré comme utilisé.
          </p>
        </div>

        {/* Ticket */}

        <div className="space-y-6 p-6 sm:p-8">
          <TicketInfo
            icon={<Ticket className="h-5 w-5" />}
            label="Numéro du billet"
            value={ticket.ticketNumber}
          />

          <TicketInfo
            icon={<User className="h-5 w-5" />}
            label="Participant"
            value={ticket.participantName}
          />

          <TicketInfo
            icon={<Camera className="h-5 w-5" />}
            label="Événement"
            value={ticket.eventTitle}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TicketInfo
              icon={<ScanLine className="h-5 w-5" />}
              label="Statut"
              value="UTILISÉ"
            />

            <TicketInfo
              icon={<ShieldCheck className="h-5 w-5" />}
              label="Accès"
              value="AUTORISÉ"
            />
          </div>

          <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
            <p className="text-center text-sm text-emerald-200">
              ✓ Le participant peut accéder au Camp International Silo 2026.
            </p>
          </div>
        </div>

        {/* Action */}

        <div className="border-t border-emerald-400/15 p-6">
          <button
            type="button"
            onClick={onScanAnother}
            className="btn-gold flex w-full items-center justify-center gap-2"
          >
            <ScanLine className="h-5 w-5" />
            Scanner un autre billet
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   INVALID TICKET
========================================================= */

function InvalidTicket({
  ticket,
  message,
  onScanAnother,
}: {
  ticket: SiloTicket | null;
  message: string;
  onScanAnother: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="overflow-hidden rounded-3xl border border-red-400/20 bg-red-400/5">
        {/* Header */}

        <div className="border-b border-red-400/15 p-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-400/15 text-red-300">
            <XCircle className="h-11 w-11" />
          </div>

          <h2 className="mt-6 font-display text-3xl text-cream">
            Accès refusé
          </h2>

          <p className="mt-2 text-sm text-red-300">{message}</p>
        </div>

        {/* Informations */}

        {ticket && (
          <div className="space-y-5 p-6 sm:p-8">
            <TicketInfo
              icon={<Ticket className="h-5 w-5" />}
              label="Numéro du billet"
              value={ticket.ticketNumber}
            />

            <TicketInfo
              icon={<User className="h-5 w-5" />}
              label="Participant"
              value={ticket.participantName}
            />

            <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
              <p className="text-sm leading-relaxed text-red-200">
                Ce billet ne permet pas l'accès au Camp. Vérifiez son statut
                avant toute décision.
              </p>
            </div>
          </div>
        )}

        {/* Action */}

        <div className="border-t border-red-400/15 p-6">
          <button
            type="button"
            onClick={onScanAnother}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gold-400/20 bg-gold-400/5 px-5 py-3 text-sm font-medium text-gold-300 transition hover:bg-gold-400/10"
          >
            <ScanLine className="h-5 w-5" />
            Scanner un autre billet
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ERROR STATE
========================================================= */

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-3xl border border-red-400/20 bg-red-400/5 p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-400/10 text-red-300">
          <AlertCircle className="h-8 w-8" />
        </div>

        <h2 className="mt-5 font-display text-2xl text-cream">
          Impossible de scanner
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-red-200">{message}</p>

        <button
          type="button"
          onClick={onRetry}
          className="btn-gold mt-6 inline-flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   TICKET INFO
========================================================= */

function TicketInfo({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-gold-400/10 bg-ink-950/30 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-400/10 text-gold-300">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-cream-faint">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-medium text-cream">
          {value}
        </p>
      </div>
    </div>
  );
}
