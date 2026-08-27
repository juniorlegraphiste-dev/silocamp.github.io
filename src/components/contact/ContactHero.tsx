import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Reveal } from "@/components/Reveal";
import { FaPhoneAlt, FaWhatsapp } from "react-icons/fa";
import { Mail } from "lucide-react";

export function ContactHero() {
  return (
    <section className="relative overflow-hidden border-b border-gold-400/10 bg-ink-950">
      {/* Halo lumineux */}
      <div className="absolute left-1/2 top-0 h-[550px] w-[550px] -translate-x-1/2 rounded-full bg-gold-400/10 blur-[140px]" />

      {/* Grille décorative */}
      <div className="absolute inset-0 opacity-[0.04]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="container-px relative z-10 mx-auto flex min-h-[70vh] max-w-7xl items-center py-32">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-400/20 bg-gold-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold-300">
              <Mail className="h-3 w-3" />
              Contact
            </span>
          </Reveal>

          <Reveal delay={0.05}>
            <h1 className="mt-8 font-display text-5xl font-medium leading-tight text-cream sm:text-7xl">
              Une question ?
              <br />
              <span className="text-gold-gradient">
                Nous sommes à votre écoute.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-cream-dim">
              Notre équipe est disponible pour répondre à toutes vos questions
              concernant le Camp International Silo, les réservations gratuites,
              les e-billets avec QR Code ou l'accès à l'événement.
            </p>
          </Reveal>

          {/* Boutons */}
          <Reveal delay={0.15}>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="https://wa.me/212600000000"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold inline-flex items-center gap-2"
              >
                <FaWhatsapp className="text-lg" />
                <span>Discuter sur WhatsApp</span>
              </a>
              <a
                href="tel:+212600000000"
                className="btn-ghost inline-flex items-center gap-2"
              >
                <FaPhoneAlt className="text-sm" />
                <span>Nous appeler</span>
              </a>
            </div>
          </Reveal>

          {/* Statistiques */}
          <Reveal delay={0.2}>
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mt-16 grid gap-4 sm:grid-cols-3"
            >
              <div className="rounded-2xl border border-gold-400/10 bg-ink-900/40 p-6">
                <div className="font-display text-3xl text-gold-gradient">
                  24h
                </div>
                <p className="mt-2 text-sm text-cream-dim">
                  Délai moyen de réponse
                </p>
              </div>

              <div className="rounded-2xl border border-gold-400/10 bg-ink-900/40 p-6">
                <div className="font-display text-3xl text-gold-gradient">
                  100%
                </div>
                <p className="mt-2 text-sm text-cream-dim">
                  Réservation gratuite
                </p>
              </div>

              <div className="rounded-2xl border border-gold-400/10 bg-ink-900/40 p-6">
                <div className="font-display text-3xl text-gold-gradient">
                  QR
                </div>
                <p className="mt-2 text-sm text-cream-dim">
                  E-billet envoyé immédiatement
                </p>
              </div>
            </motion.div>
          </Reveal>

          {/* Retour */}
          {/* <Reveal delay={0.25}>
            <div className="mt-12">
              <Link
                to="/"
                className="text-sm text-cream-dim transition-colors hover:text-gold-300"
              >
                ← Retour à l'accueil
              </Link>
            </div>
          </Reveal> */}
        </div>
      </div>
    </section>
  );
}
