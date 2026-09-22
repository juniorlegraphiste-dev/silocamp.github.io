import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Reveal } from "@/components/Reveal";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

export function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    setSent(false);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setSent(false);
    setError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.error || "Une erreur est survenue lors de l'envoi.",
        );
      }

      // Afficher le succès uniquement après confirmation de l'API
      setSent(true);

      setForm({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (err) {
      console.error("[ContactForm]", err);

      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'envoyer votre message. Veuillez réessayer.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-4xl">
        {/* En-tête */}
        <Reveal>
          <div className="mb-10 text-center md:mb-12">
            <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#d4ae63] sm:text-xs">
              Formulaire
            </span>

            <h2 className="mt-4 font-display text-3xl font-medium leading-tight text-cream sm:text-4xl md:text-5xl">
              Envoyez-nous un message
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-cream-dim sm:text-base">
              Une question concernant votre réservation, votre e-billet ou
              l'événement ? Notre équipe vous répondra dans les meilleurs
              délais.
            </p>
          </div>
        </Reveal>

        {/* Formulaire */}
        <Reveal delay={0.1}>
          <form
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-[#d4ae63]/15 bg-[#0A0A0A]/75 p-6 shadow-[0_0_40px_rgba(212,174,99,0.03)] backdrop-blur-xl sm:p-8 md:p-10"
          >
            <div className="grid gap-5 md:grid-cols-2 md:gap-6">
              <Field
                label="Nom complet"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Votre nom"
              />

              <Field
                label="Adresse e-mail"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="vous@email.com"
              />

              {/* Téléphone */}
              <div className="min-w-0">
                <label
                  htmlFor="phone"
                  className="mb-2 block text-xs font-medium text-cream sm:text-sm"
                >
                  Téléphone
                </label>

                <div className="contact-phone-wrapper">
                  <PhoneInput
                    id="phone"
                    international
                    defaultCountry="MA"
                    value={form.phone}
                    onChange={(value) => {
                      setForm((prev) => ({
                        ...prev,
                        phone: value ?? "",
                      }));

                      setSent(false);
                      setError("");
                    }}
                    placeholder="Entrez votre numéro"
                    countryCallingCodeEditable={false}
                  />
                </div>
              </div>

              {/* Sujet */}
              <Field
                label="Sujet"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="Objet de votre demande"
              />
            </div>

            {/* Message */}
            <div className="mt-5 md:mt-6">
              <label
                htmlFor="message"
                className="mb-2 block text-xs font-medium text-cream sm:text-sm"
              >
                Votre message
              </label>

              <textarea
                id="message"
                name="message"
                rows={7}
                value={form.message}
                onChange={handleChange}
                placeholder="Décrivez votre demande..."
                required
                className="w-full resize-y rounded-2xl border border-[#d4ae63]/20 bg-[#0A0A0A]/70 px-4 py-4 text-sm text-cream outline-none transition-all duration-300 placeholder:text-[#8f8879] focus:border-[#d4ae63]/70 focus:ring-1 focus:ring-[#d4ae63]/20 sm:px-5"
              />
            </div>

            {/* Erreur */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  role="alert"
                  className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-relaxed text-red-300"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bouton */}
            <button
              type="submit"
              disabled={loading}
              className="mt-7 flex h-14 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#F0D99A] via-[#DCC07A] to-[#B4873A] px-5 text-sm font-semibold text-[#0A0A0A] shadow-[0_8px_25px_rgba(212,174,99,0.18)] transition-all duration-300 hover:brightness-105 hover:shadow-[0_10px_30px_rgba(212,174,99,0.35)] disabled:cursor-not-allowed disabled:opacity-50 sm:h-16 sm:text-base"
            >
              {loading ? "Envoi en cours..." : "Envoyer le message"}
            </button>

            {/* Confirmation */}
            <AnimatePresence>
              {sent && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  role="status"
                  className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5"
                >
                  <h3 className="font-display text-xl text-cream">
                    Message envoyé 🎉
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-cream-dim">
                    Merci de nous avoir contactés. Notre équipe vous répondra
                    dans les plus brefs délais.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={name}
        className="mb-2 block text-xs font-medium text-cream sm:text-sm"
      >
        {label}
      </label>

      <input
        id={name}
        type={type}
        name={name}
        required
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-14 w-full rounded-2xl border border-[#d4ae63]/20 bg-[#0A0A0A]/70 px-4 text-sm text-cream outline-none transition-all duration-300 placeholder:text-[#8f8879] focus:border-[#d4ae63]/70 focus:ring-1 focus:ring-[#d4ae63]/20 sm:px-5"
      />
    </div>
  );
}
