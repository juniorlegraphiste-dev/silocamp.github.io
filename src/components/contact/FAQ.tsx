import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Reveal } from "@/components/Reveal";
import { FaEnvelope, FaWhatsapp } from "react-icons/fa";

const faqs = [
  {
    question: "La réservation est-elle vraiment gratuite ?",
    answer:
      "Oui. La participation au Camp International Silo est entièrement gratuite. Il vous suffit de réserver votre place en ligne pour recevoir votre e-billet avec QR Code.",
  },
  {
    question: "Comment vais-je recevoir mon e-billet ?",
    answer:
      "Après la confirmation de votre réservation, votre e-billet est envoyé immédiatement par e-mail. Vous pourrez également le télécharger depuis la page de confirmation.",
  },
  {
    question: "Dois-je imprimer mon billet ?",
    answer:
      "Non. Vous pouvez simplement présenter votre e-billet sur votre téléphone. Le QR Code sera scanné à votre arrivée.",
  },
  {
    question: "Puis-je modifier ou annuler ma réservation ?",
    answer:
      "Oui. Contactez notre équipe avant le début de l'événement afin que nous puissions mettre à jour ou annuler votre réservation.",
  },
  {
    question: "Que faire si je ne reçois pas mon e-mail ?",
    answer:
      "Vérifiez d'abord votre dossier Spam ou Courrier indésirable. Si vous ne trouvez toujours pas votre billet, contactez-nous via WhatsApp ou par e-mail.",
  },
];

export function ContactFAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-24">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <div className="mb-14 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-300">
              FAQ
            </span>

            <h2 className="mt-4 font-display text-4xl text-cream">
              Questions fréquentes
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-cream-dim">
              Retrouvez rapidement les réponses aux questions les plus
              fréquemment posées concernant les réservations et le Camp
              International Silo.
            </p>
          </div>
        </Reveal>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const active = open === index;

            return (
              <Reveal key={faq.question} delay={index * 0.05}>
                <div className="overflow-hidden rounded-2xl border border-gold-400/10 bg-ink-900/40">
                  <button
                    type="button"
                    onClick={() => setOpen(active ? null : index)}
                    className="flex w-full items-center justify-between px-6 py-5 text-left transition hover:bg-gold-400/5"
                  >
                    <span className="font-display text-lg text-cream">
                      {faq.question}
                    </span>

                    <motion.span
                      animate={{ rotate: active ? 180 : 0 }}
                      transition={{ duration: 0.25 }}
                      className="text-gold-300"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          d="m6 9 6 6 6-6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {active && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                          height: "auto",
                          opacity: 1,
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                        }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-gold-400/10 px-6 py-5">
                          <p className="leading-relaxed text-cream-dim">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.3}>
          <div className="mt-12 rounded-3xl border border-gold-400/10 bg-gold-400/5 p-8 text-center">
            <h3 className="font-display text-2xl text-cream">
              Vous n'avez pas trouvé votre réponse ?
            </h3>

            <p className="mx-auto mt-4 max-w-xl text-cream-dim">
              Notre équipe reste disponible pour répondre à toutes vos questions
              concernant votre réservation ou l'organisation du Camp
              International Silo.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <a
                href="https://wa.me/212600000000"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold inline-flex items-center gap-2"
              >
                <FaWhatsapp className="text-xl" />
                <span>Contacter sur WhatsApp</span>
              </a>

              <a
                href="mailto:contact@silocamp.com"
                className="btn-ghost inline-flex items-center gap-2"
              >
                <FaEnvelope className="text-base" />
                <span>Envoyer un e-mail</span>
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
