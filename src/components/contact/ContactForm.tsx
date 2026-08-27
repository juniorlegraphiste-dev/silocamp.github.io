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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // TODO : Envoyer vers votre API / Resend / EmailJS

    setSent(true);

    setForm({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    });

    setTimeout(() => setSent(false), 5000);
  };

  return (
    <section className="py-24">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <div className="mb-12 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-300">
              Formulaire
            </span>

            <h2 className="mt-4 font-display text-4xl text-cream">
              Envoyez-nous un message
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-cream-dim">
              Une question concernant votre réservation, votre e-billet ou
              l'événement ? Notre équipe vous répondra dans les meilleurs
              délais.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-gold-400/10 bg-ink-900/40 p-8 backdrop-blur-xl"
          >
            <div className="grid gap-6 md:grid-cols-2">
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
              {/* Téléphone */}
              <div className="min-w-0">
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-medium text-cream"
                >
                  Téléphone
                </label>

                <div className="phone-wrapper">
                  <PhoneInput
                    id="phone"
                    international
                    defaultCountry="MA"
                    value={form.phone}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        phone: value ?? "",
                      }))
                    }
                    placeholder="Entrez votre numéro"
                    countryCallingCodeEditable={false}
                  />
                </div>
              </div>

              {/* Sujet */}
              <div className="min-w-0">
                <Field
                  label="Sujet"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="Objet de votre demande"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-cream">
                Votre message
              </label>

              <textarea
                name="message"
                rows={7}
                value={form.message}
                onChange={handleChange}
                placeholder="Décrivez votre demande..."
                required
                className="w-full rounded-2xl border border-gold-400/15 bg-ink-950/60 px-5 py-4 text-cream placeholder:text-cream-faint outline-none transition focus:border-gold-400"
              />
            </div>

            <button
              type="submit"
              className="btn-gold mt-8 w-full justify-center text-base"
            >
              Envoyer le message
            </button>

            <AnimatePresence>
              {sent && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5"
                >
                  <h3 className="font-display text-xl text-cream">
                    Message envoyé 🎉
                  </h3>

                  <p className="mt-2 text-sm text-cream-dim">
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
    <div>
      <label className="mb-2 block text-sm font-medium text-cream">
        {label}
      </label>

      <input
        type={type}
        name={name}
        required
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-gold-400/15 bg-ink-950/60 px-5 py-4 text-cream placeholder:text-cream-faint outline-none transition focus:border-gold-400"
      />
    </div>
  );
}
