
import { FormEvent, useState } from "react";

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
    <main className="min-h-screen bg-[#0A0A0A] px-4 py-16 text-white">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-4 text-3xl font-bold">
          Annuler mon billet
        </h1>

        <p className="mb-8 text-gray-300">
          Saisissez le numéro de votre billet et l’adresse
          e-mail utilisée lors de l’inscription.
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl bg-[#171717] p-6"
        >
          <div>
            <label className="mb-2 block text-sm font-medium">
              Numéro du billet
            </label>

            <input
              type="text"
              required
              value={ticketNumber}
              onChange={(event) =>
                setTicketNumber(event.target.value)
              }
              placeholder="Ex. SILO-2026-XXXX"
              className="w-full rounded-lg border border-gray-700 bg-[#0A0A0A] px-4 py-3 text-white outline-none focus:border-yellow-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Adresse e-mail
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="vous@example.com"
              className="w-full rounded-lg border border-gray-700 bg-[#0A0A0A] px-4 py-3 text-white outline-none focus:border-yellow-400"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-900/40 p-3 text-sm text-red-300">
              {error}
            </p>
          )}

          {message && (
            <p className="rounded-lg bg-green-900/40 p-3 text-sm text-green-300">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-yellow-400 px-4 py-3 font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Annulation en cours..."
              : "Confirmer l’annulation"}
          </button>
        </form>
      </div>
    </main>
  );
}