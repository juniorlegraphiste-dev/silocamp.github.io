import { FormEvent, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Mail,
  Ticket,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Annulation() {
  const [ticketNumber, setTicketNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/tickets/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketNumber: ticketNumber.trim(),
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Impossible d'annuler ce billet.");
      }

      setMessage(data?.message || "Votre billet a été annulé avec succès.");

      setTicketNumber("");
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-4 pb-16 pt-32 text-[#F5F5F2] sm:pb-20 sm:pt-40">
      <div className="mx-auto w-full max-w-3xl">
        {/* =====================================================
            EN-TÊTE
        ===================================================== */}

        <header className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
          {/* Badge */}

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#C8A45D]/25 bg-[#C8A45D]/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C8A45D]">
            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-[#C8A45D]/50">
              <Ticket className="h-2.5 w-2.5" />
            </span>
            Gestion du billet
          </div>

          {/* Titre */}

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Annulez votre <span className="text-[#C8A45D]">réservation</span>
          </h1>

          {/* Description */}

          <p className="mx-auto mt-3 max-w-xl text-xs leading-5 text-white/40 sm:text-sm">
            Saisissez les informations utilisées lors de votre inscription afin
            d'annuler votre billet SiloCamp.
          </p>
        </header>

        {/* =====================================================
            FORMULAIRE
        ===================================================== */}

        <section className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-[#C8A45D]/15 bg-[#0D0D0D]">
          {/* Formulaire */}

          <div className="px-5 py-7 sm:px-7 sm:py-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* =================================================
                  NUMÉRO DU BILLET
              ================================================= */}

              <div>
                <label
                  htmlFor="ticketNumber"
                  className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50"
                >
                  Numéro du billet
                </label>

                <div className="relative">
                  <Ticket className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C8A45D]/50" />

                  <input
                    id="ticketNumber"
                    type="text"
                    required
                    autoComplete="off"
                    value={ticketNumber}
                    onChange={(event) => setTicketNumber(event.target.value)}
                    placeholder="SILO-2026-XXXX"
                    className="h-12 w-full rounded-lg border border-[#C8A45D]/20 bg-[#0A0A0A] pl-10 pr-4 text-xs text-[#F5F5F2] outline-none transition placeholder:text-white/20 focus:border-[#C8A45D]/60 focus:ring-1 focus:ring-[#C8A45D]/10"
                  />
                </div>
              </div>

              {/* =================================================
                  ADRESSE E-MAIL
              ================================================= */}

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50"
                >
                  Adresse e-mail
                </label>

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C8A45D]/50" />

                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="exemple@email.com"
                    className="h-12 w-full rounded-lg border border-[#C8A45D]/20 bg-[#0A0A0A] pl-10 pr-4 text-xs text-[#F5F5F2] outline-none transition placeholder:text-white/20 focus:border-[#C8A45D]/60 focus:ring-1 focus:ring-[#C8A45D]/10"
                  />
                </div>
              </div>

              {/* =================================================
                  ERREUR
              ================================================= */}

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/[0.06] p-3.5"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

                  <p className="text-xs leading-5 text-red-300">{error}</p>
                </div>
              )}

              {/* =================================================
                  SUCCÈS
              ================================================= */}

              {message && (
                <div
                  role="status"
                  className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] p-3.5"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />

                  <p className="text-xs leading-5 text-emerald-300">
                    {message}
                  </p>
                </div>
              )}

              {/* =================================================
                  BOUTON
              ================================================= */}

              <button
                type="submit"
                disabled={loading}
                className="group flex h-16 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#F0D99A] via-[#DCC07A] to-[#B4873A] px-5 text-sm font-semibold text-[#0A0A0A] shadow-[0_8px_25px_rgba(212,174,99,0.20)] transition-all duration-300 hover:brightness-105 hover:shadow-[0_10px_30px_rgba(212,174,99,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                    Annulation en cours...
                  </>
                ) : (
                  <>
                    Confirmer l'annulation
                    <ArrowLeft className="h-3.5 w-3.5 rotate-180 transition-transform duration-200 group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* =====================================================
              INFORMATION BAS DE CARTE
          ===================================================== */}

          <div className="border-t border-white/[0.06] px-5 py-4 sm:px-7">
            <p className="text-center text-[9px] leading-4 text-white/25">
              L'annulation de votre billet est définitive. Une réservation
              annulée ne pourra plus être utilisée pour accéder au Camp
              International Silo 2026.
            </p>
          </div>
        </section>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <div className="mt-7 text-center">
          <p className="text-[9px] uppercase tracking-[0.15em] text-white/20">
            Camp International Silo 2026
          </p>

          <p className="mt-1 text-[10px] text-white/25">
            Gospel · Adoration · Communion
          </p>
        </div>
      </div>
    </main>
  );
}
