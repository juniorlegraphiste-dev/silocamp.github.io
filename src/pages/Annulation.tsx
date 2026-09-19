import { FormEvent, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Mail,
  ShieldCheck,
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
        throw new Error(
          data?.error || "Impossible d'annuler ce billet."
        );
      }

      setMessage(
        data?.message ||
          "Votre billet a été annulé avec succès."
      );

      setTicketNumber("");
      setEmail("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0A0714] text-white">
      {/* Background décoratif */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#C8A45D]/10 blur-[100px]" />
        <div className="absolute bottom-[-200px] left-[-120px] h-[400px] w-[400px] rounded-full bg-purple-700/10 blur-[120px]" />
        <div className="absolute right-[-120px] top-1/3 h-[350px] w-[350px] rounded-full bg-[#C8A45D]/5 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl">
          {/* Retour */}
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-[#C8A45D]"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>

          <div className="grid overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/40 backdrop-blur-xl lg:grid-cols-[0.9fr_1.1fr]">
            {/* Partie gauche */}
            <section className="relative flex flex-col justify-between overflow-hidden border-b border-white/10 p-7 sm:p-10 lg:border-b-0 lg:border-r">
              <div>
                {/* Badge */}
                <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#C8A45D]/25 bg-[#C8A45D]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#D9B96E]">
                  <Ticket className="h-4 w-4" />
                  Billetterie SiloCamp
                </div>

                <h1 className="max-w-md text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
                  Annuler
                  <span className="block text-[#C8A45D]">
                    mon billet
                  </span>
                </h1>

                <p className="mt-6 max-w-md text-sm leading-7 text-white/60 sm:text-base">
                  Vous ne pouvez plus participer au Camp International
                  Silo 2026 ? Vous pouvez annuler simplement votre
                  réservation à l'aide de votre numéro de billet et de
                  l'adresse e-mail utilisée lors de votre inscription.
                </p>
              </div>

              {/* Informations */}
              <div className="mt-10 space-y-4">
                <div className="flex items-start gap-4 rounded-2xl border border-white/8 bg-black/20 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C8A45D]/10 text-[#C8A45D]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-white">
                      Vérification sécurisée
                    </p>
                    <p className="mt-1 text-xs leading-5 text-white/45">
                      Votre billet est retrouvé grâce à votre numéro
                      de billet et votre adresse e-mail.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl border border-white/8 bg-black/20 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-300">
                    <Mail className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-white">
                      Une seule réservation
                    </p>
                    <p className="mt-1 text-xs leading-5 text-white/45">
                      L'annulation libère automatiquement la place
                      associée à votre réservation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Décoration */}
              <div className="pointer-events-none absolute -bottom-20 -right-20 h-52 w-52 rounded-full border border-[#C8A45D]/10" />
              <div className="pointer-events-none absolute -bottom-12 -right-12 h-36 w-36 rounded-full border border-[#C8A45D]/10" />
            </section>

            {/* Partie droite : formulaire */}
            <section className="p-7 sm:p-10">
              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C8A45D]">
                  Gestion de réservation
                </p>

                <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                  Vos informations
                </h2>

                <p className="mt-2 text-sm leading-6 text-white/50">
                  Entrez les informations exactement comme lors de
                  votre inscription.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* Numéro billet */}
                <div>
                  <label
                    htmlFor="ticketNumber"
                    className="mb-2 block text-sm font-medium text-white/80"
                  >
                    Numéro du billet
                  </label>

                  <div className="relative">
                    <Ticket className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />

                    <input
                      id="ticketNumber"
                      type="text"
                      required
                      autoComplete="off"
                      value={ticketNumber}
                      onChange={(event) =>
                        setTicketNumber(event.target.value)
                      }
                      placeholder="SILO-2026-XXXX"
                      className="h-14 w-full rounded-xl border border-white/10 bg-[#0D0A17] pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#C8A45D]/60 focus:ring-2 focus:ring-[#C8A45D]/10"
                    />
                  </div>

                  <p className="mt-2 text-xs text-white/35">
                    Exemple : SILO-2026-XXXX
                  </p>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-white/80"
                  >
                    Adresse e-mail
                  </label>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />

                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      placeholder="vous@example.com"
                      className="h-14 w-full rounded-xl border border-white/10 bg-[#0D0A17] pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#C8A45D]/60 focus:ring-2 focus:ring-[#C8A45D]/10"
                    />
                  </div>
                </div>

                {/* Erreur */}
                {error && (
                  <div
                    role="alert"
                    className="flex gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
                  >
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <p className="leading-6">{error}</p>
                  </div>
                )}

                {/* Succès */}
                {message && (
                  <div
                    role="status"
                    className="flex gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    <p className="leading-6">{message}</p>
                  </div>
                )}

                {/* Bouton */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#C8A45D] px-5 text-sm font-bold text-[#17100A] shadow-lg shadow-[#C8A45D]/10 transition duration-300 hover:bg-[#D9B96E] hover:shadow-[#C8A45D]/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#17100A]/30 border-t-[#17100A]" />
                      Annulation en cours...
                    </>
                  ) : (
                    <>
                      Confirmer l'annulation
                      <ArrowLeft className="h-4 w-4 rotate-180 transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs leading-5 text-white/35">
                  Cette action concerne uniquement votre réservation
                  SiloCamp. Vérifiez vos informations avant de
                  confirmer.
                </p>
              </form>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-white/30">
              Camp International Silo 2026
              <span className="mx-2 text-[#C8A45D]/50">•</span>
              Gospel · Adoration · Communion
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}