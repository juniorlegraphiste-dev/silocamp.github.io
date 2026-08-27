import { motion } from "framer-motion";
import { Reveal } from "@/components/Reveal";

const contacts = [
  {
    title: "Téléphone",
    value: "+212 6 00 00 00 00",
    description: "Disponible du lundi au samedi • 09h00 à 18h00",
    href: "tel:+212600000000",
    icon: <PhoneIcon />,
  },
  {
    title: "WhatsApp",
    value: "Discuter avec notre équipe",
    description: "Réponse rapide en quelques minutes.",
    href: "https://wa.me/212600000000",
    icon: <WhatsappIcon />,
  },
  {
    title: "E-mail",
    value: "contact@silocamp.com",
    description: "Nous répondons sous 24 heures. Laissez-nous un message",
    href: "mailto:contact@silocamp.com",
    icon: <MailIcon />,
  },
  {
    title: "Adresse",
    value: "Camp International Silo",
    description: "Oasis Center • Casablanca  • Maroc",
    href: "#",
    icon: <LocationIcon />,
  },
];

export function ContactInfo() {
  return (
    <section>
      <Reveal>
        <div className="mb-14 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-300">
            Nos coordonnées
          </span>

          <h2 className="mt-4 font-display text-4xl font-medium text-cream">
            Plusieurs moyens de nous joindre
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-cream-dim">
            Choisissez le moyen de communication qui vous convient le mieux.
            Notre équipe est disponible pour répondre à toutes vos questions.
          </p>
        </div>
      </Reveal>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {contacts.map((item, index) => (
          <Reveal key={item.title} delay={index * 0.08}>
            <motion.a
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              whileHover={{ y: -8 }}
              transition={{ duration: 0.25 }}
              className="group block rounded-3xl border border-gold-400/10 bg-ink-900/40 p-8 transition-all hover:border-gold-400/30 hover:bg-gold-400/5"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-400/10 text-gold-300 transition group-hover:bg-gold-400 group-hover:text-ink-950">
                {item.icon}
              </div>

              <h3 className="mt-6 font-display text-2xl text-cream">
                {item.title}
              </h3>

              <p className="mt-3 font-medium text-gold-200">{item.value}</p>

              <p className="mt-3 text-sm leading-relaxed text-cream-dim">
                {item.description}
              </p>

              <div className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-gold-300 transition group-hover:gap-3">
                En savoir plus
                <ArrowIcon />
              </div>
            </motion.a>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Icons */
/* -------------------------------------------------------------------------- */

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path d="M22 16.92V20a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 11.29 19a19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.18 2 2 0 0 1 4 2h3.09a2 2 0 0 1 2 1.72l.38 2.66a2 2 0 0 1-.57 1.72L7.1 9.9a16 16 0 0 0 7 7l1.8-1.8a2 2 0 0 1 1.72-.57l2.66.38A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

function WhatsappIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
      <path d="M12 2a10 10 0 0 0-8.7 15l-1.3 5 5.1-1.3A10 10 0 1 0 12 2Zm5.3 14.2c-.2.6-1.2 1.1-1.7 1.2-.5.1-1.2.2-3.9-.9-3.2-1.4-5.2-4.7-5.4-4.9-.2-.2-1.3-1.7-1.3-3.3 0-1.6.8-2.3 1.1-2.6.3-.3.6-.4.8-.4h.6c.2 0 .5 0 .7.5.3.6.9 2 .9 2.2.1.2.1.4 0 .6-.1.2-.2.4-.4.6l-.5.6c-.2.2-.3.4-.1.7.2.3.9 1.5 2 2.4 1.4 1.3 2.5 1.7 2.9 1.9.3.1.5.1.7-.1l.9-1c.2-.3.5-.3.8-.2.3.1 1.9.9 2.2 1 .3.2.5.3.5.5 0 .2 0 .8-.2 1.4Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path d="M12 22s7-5.4 7-12a7 7 0 1 0-14 0c0 6.6 7 12 7 12Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        d="M5 12h14M13 5l7 7-7 7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
