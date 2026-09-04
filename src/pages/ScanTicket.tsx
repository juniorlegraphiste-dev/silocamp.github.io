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
  LockKeyhole,
  LogIn,
  LogOut,
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

  const [authChecking, setAuthChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  async function stopScanner() {
    const scanner = scannerRef.current;

    if (!scanner) {
      return;
    }

    try {
      const scannerState = scanner.getState();

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

  async function checkAuthentication() {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        setAuthenticated(false);
        return;
      }

      const data = await response.json();

      setAuthenticated(data.authenticated === true);
    } catch (error) {
      console.error("[SiloCamp Auth Check]", error);

      setAuthenticated(false);
    } finally {
      setAuthChecking(false);
    }
  }

  useEffect(() => {
    void checkAuthentication();

    return () => {
      void stopScanner();
    };
  }, []);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!login.trim() || !password) {
      setAuthError("Veuillez saisir votre identifiant et votre mot de passe.");
      return;
    }

    setAuthBusy(true);
    setAuthError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          login: login.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setAuthenticated(false);
        setAuthError(data.message || "Identifiant ou mot de passe incorrect.");
        return;
      }

      setAuthenticated(true);
      setLogin("");
      setPassword("");
      setAuthError("");
      setState("idle");
      setTicket(null);
      setMessage("");
    } catch (error) {
      console.error("[SiloCamp Auth Login]", error);

      setAuthenticated(false);
      setAuthError("Impossible de contacter le serveur.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogout() {
    await stopScanner();

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("[SiloCamp Auth Logout]", error);
    }

    setAuthenticated(false);
    setTicket(null);
    setMessage("");
    setState("idle");
  }

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
        case "TICKET_ALREADY_USED":
        case "USED":
          setState("used");

          setMessage(result.message || "Ce billet a déjà été utilisé.");

          break;

        case "TICKET_CANCELLED":
        case "CANCELLED":
          setState("cancelled");

          setMessage(result.message || "Ce billet a été annulé.");

          break;

        case "TICKET_NOT_FOUND":
        case "NOT_FOUND":
          setState("not-found");

          setMessage(result.message || "Billet introuvable.");

          break;

        case "SCAN_UNAUTHORIZED":
          setState("error");

          setMessage(
            "Authentification requise pour vérifier les billets. Connecte-toi au scanner.",
          );

          break;

        case "TOKEN_REQUIRED":
        case "INVALID_TOKEN":
          setState("error");

          setMessage(result.message || "QR Code invalide.");

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
        () => {},
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

  async function resetScanner() {
    await stopScanner();

    setTicket(null);
    setMessage("");
    setState("idle");
  }

  if (authChecking) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 pb-8 pt-[200px] sm:px-6 sm:pt-28">
        <div className="mx-auto flex w-full max-w-lg items-center justify-center">
          <div className="text-center text-white">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>

            <h1 className="text-2xl font-black">Vérification de l'accès</h1>

            <p className="mt-2 text-sm text-white/60">
              Sécurisation de l'espace de contrôle...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 pb-8 pt-[200px] sm:px-6 sm:pt-28">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 text-center text-white">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
              <TicketIcon className="h-7 w-7" strokeWidth={1.8} />
            </div>

            <h1 className="text-3xl font-black">SiloCamp</h1>

            <p className="mt-1 text-sm text-white/60">
              Espace sécurisé de contrôle
            </p>
          </div>

          <div className="overflow-hidden rounded-[30px] bg-white shadow-2xl">
            <div className="p-7 sm:p-8">
              <div className="mb-7 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
                  <LockKeyhole className="h-8 w-8" />
                </div>

                <h2 className="text-2xl font-black text-slate-900">
                  Accès sécurisé
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Connectez-vous pour accéder au scanner des billets.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label
                    htmlFor="scan-login"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Identifiant
                  </label>

                  <input
                    id="scan-login"
                    type="text"
                    value={login}
                    onChange={(event) => setLogin(event.target.value)}
                    autoComplete="username"
                    placeholder="Votre identifiant"
                    disabled={authBusy}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="scan-password"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Mot de passe
                  </label>

                  <input
                    id="scan-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    placeholder="Votre mot de passe"
                    disabled={authBusy}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                {authError && (
                  <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

                    <p>{authError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authBusy}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 px-5 py-4 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {authBusy ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-5 w-5" />
                      Accéder au scanner
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-center">
                <p className="text-xs leading-5 text-slate-500">
                  Accès réservé à l'équipe autorisée au contrôle des billets
                  SiloCamp.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-8 pt-[200px] sm:px-6 sm:pt-28">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-6 text-center text-white">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <TicketIcon className="h-7 w-7" strokeWidth={1.8} />
          </div>

          <h1 className="text-3xl font-black">SiloCamp</h1>

          <p className="mt-1 text-sm text-white/60">Contrôle des billets</p>

          <button
            type="button"
            onClick={handleLogout}
            className="mx-auto mt-4 flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white/80 transition hover:bg-white/15 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>

        {state === "idle" || state === "scanning" ? (
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
        ) : null}

        {state === "verifying" && (
          <StatusCard
            icon={<Loader2 className="h-10 w-10 animate-spin text-blue-600" />}
            title="Vérification..."
            message="Recherche du billet dans la base de données SiloCamp."
            background="bg-blue-50"
          />
        )}

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

        {state === "confirmed" && ticket && (
          <TicketResult
            ticket={ticket}
            status="confirmed"
            message={message}
            onReset={resetScanner}
            busy={false}
          />
        )}

        {state === "used" && ticket && (
          <TicketResult
            ticket={ticket}
            status="used"
            message={message}
            onReset={resetScanner}
            busy={false}
          />
        )}

        {state === "cancelled" && ticket && (
          <TicketResult
            ticket={ticket}
            status="cancelled"
            message={message}
            onReset={resetScanner}
            busy={false}
          />
        )}

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

function extractVerificationToken(value: string): string | null {
  const text = value.trim();

  if (!text) {
    return null;
  }

  if (!text.startsWith("http://") && !text.startsWith("https://")) {
    return text;
  }

  try {
    const url = new URL(text);
    const token = url.searchParams.get("token");

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
      <div className={`px-6 py-8 text-center ${statusBackground}`}>
        {isConfirmed || isValid ? (
          <CheckCircle2 className="mx-auto h-14 w-14 text-white" />
        ) : (
          <XCircle className="mx-auto h-14 w-14 text-white" />
        )}

        <h2 className="mt-4 text-2xl font-black text-white">{statusTitle}</h2>

        <p className="mt-2 text-sm leading-6 text-white/85">{message}</p>
      </div>

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
