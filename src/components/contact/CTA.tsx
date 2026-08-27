import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Reveal } from "@/components/Reveal";
import { FaWhatsapp } from "react-icons/fa";
import { ArrowRight } from "lucide-react";

export function ContactCTA() {
  return (
    <section className="relative overflow-hidden py-24">
      {/* Halo lumineux */}
      <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-400/10 blur-[140px]" />

      <div className="container-px relative z-10 mx-auto max-w-6xl">
        <Reveal>
          <div className="overflow-hidden rounded-[2rem] border border-gold-400/15 bg-gradient-to-br from-ink-900 to-ink-950 p-10 shadow-2xl shadow-black/40 sm:p-14">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex rounded-full border border-gold-400/20 bg-gold-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-gold-300">
                Camp International Silo 2026
              </span>

              <h2 className="mt-6 font-display text-4xl font-medium leading-tight text-cream sm:text-5xl">
                Prêt à vivre une expérience
                <span className="text-gold-gradient"> inoubliable ?</span>
              </h2>

              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-cream-dim">
                Réservez gratuitement votre place dès aujourd'hui et recevez
                instantanément votre e-billet avec QR Code. Notre équipe reste
                également disponible pour répondre à toutes vos questions.
              </p>

              {/* Boutons */}
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  to="/"
                  className="btn-gold group inline-flex items-center gap-2"
                >
                  <span>Réserver gratuitement</span>
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>

                <a
                  href="https://wa.me/212600000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost inline-flex items-center gap-2"
                >
                  <FaWhatsapp className="text-lg" />
                  <span>Discuter sur WhatsApp</span>
                </a>
              </div>

              {/* Avantages */}
              <div className="mt-12 grid gap-4 sm:grid-cols-3">
                <Feature
                  title="100 % Gratuit"
                  description="Aucun frais de réservation."
                />

                <Feature
                  title="E-billet instantané"
                  description="QR Code envoyé immédiatement."
                />

                <Feature
                  title="Support disponible"
                  description="Nous répondons rapidement à vos questions."
                />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Feature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-gold-400/10 bg-gold-400/5 p-5"
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gold-400 text-ink-950">
        ✓
      </div>

      <h3 className="font-display text-lg text-cream">{title}</h3>

      <p className="mt-2 text-sm leading-relaxed text-cream-dim">
        {description}
      </p>
    </motion.div>
  );
}
