import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Eye,
  MapPin,
  Music,
  QrCode,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import heroImg from "@/assets/hero.jpg";
import intimateImg from "@/assets/event-intimate.jpg";

import { Countdown } from "@/components/Countdown";
import { SectionHeading } from "@/components/SectionHeading";
import { EventCard } from "@/components/EventCard";
import { Reveal, staggerContainer, staggerItem } from "@/components/Reveal";

import { events, featuredEvent } from "@/data/events";
import { useCart } from "@/context/CartContext";
import { getTicketsRemaining } from "@/services/ticketService";

const EASE = [0.22, 1, 0.36, 1] as const;

const MAX_TICKETS = 1500;

/* =========================================================
   HOME
========================================================= */

export default function Home() {


  const [ticketsRemaining, setTicketsRemaining] = useState<number>(MAX_TICKETS);

  /* ---------------------------------------------------------
     Charger le stock disponible
  --------------------------------------------------------- */

  useEffect(() => {
    let mounted = true;

    async function loadTickets() {
      try {
        const remaining = await getTicketsRemaining();

        if (mounted) {
          setTicketsRemaining(Math.max(0, Math.min(MAX_TICKETS, remaining)));
        }
      } catch (error) {
        console.error("Erreur lors du chargement des billets :", error);
      }
    }

    loadTickets();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const sectionId = sessionStorage.getItem("silo-scroll-to");

    if (!sectionId) {
      return;
    }

    const timer = window.setTimeout(() => {
      const element = document.getElementById(sectionId);

      if (!element) {
        console.warn(`Section #${sectionId} introuvable`);
        sessionStorage.removeItem("silo-scroll-to");
        return;
      }

      const navbarHeight = 80;

      const top =
        element.getBoundingClientRect().top + window.scrollY - navbarHeight;

      window.scrollTo({
        top,
        behavior: "smooth",
      });

      sessionStorage.removeItem("silo-scroll-to");
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <>
      {/* =====================================================
          HERO
      ===================================================== */}

      <Hero ticketsRemaining={ticketsRemaining} />

      {/* =====================================================
          BANDEAU
      ===================================================== */}

      <Marquee />

      {/* =====================================================
          STATISTIQUES
      ===================================================== */}

      <Stats ticketsRemaining={ticketsRemaining} />

      {/* =====================================================
          EXPÉRIENCE
      ===================================================== */}

      <Experience />

      {/* =====================================================
          ÉVÉNEMENT À LA UNE
      ===================================================== */}

      <FeaturedEvent ticketsRemaining={ticketsRemaining} />

      {/* =====================================================
          PROCHAINS ÉVÉNEMENTS
      ===================================================== */}

      <UpcomingEvents />

      {/* =====================================================
          GARANTIES
      ===================================================== */}

      <Guarantees />

      {/* =====================================================
          FAQ
      ===================================================== */}

      <Faq />
    </>
  );
}

/* =========================================================
   HERO
========================================================= */

function Hero({ ticketsRemaining }: { ticketsRemaining: number }) {
  const { setEvent } = useCart();

  return (
    <section
      id="accueil"
      className="relative flex min-h-[90vh] scroll-mt-20 items-center overflow-hidden"
    >
      {/* Image de fond */}

      <motion.img
        src={heroImg}
        alt="Foule en adoration lors du Camp International Silo"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover"
        initial={{ scale: 1.12 }}
        animate={{ scale: 1 }}
        transition={{
          duration: 12,
          ease: "easeOut",
        }}
      />

      {/* Voiles */}

      <div className="absolute inset-0 bg-black/45" />

      <div className="absolute inset-0 bg-gradient-to-r from-ink-950/95 via-ink-950/75 to-ink-950/35" />

      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/20 to-ink-950/40" />

      {/* Contenu */}

      <div className="container-px relative z-10 mx-auto w-full max-w-7xl pb-16 pt-32 md:pb-24 md:pt-40">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="max-w-4xl"
        >
          {/* Badge */}

          <motion.div variants={staggerItem}>
            <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-gold-400/30 bg-ink-950/40 px-3 py-1.5 text-[10px] tracking-[0.18em] text-gold-200 backdrop-blur sm:px-4 sm:text-xs sm:tracking-[0.25em]">
              <span className="h-1.5 w-1.5 shrink-0 animate-glow rounded-full bg-gold-300" />

              <span>CAMP INTERNATIONAL SILO · 3e ÉDITION · 2026</span>
            </span>
          </motion.div>

          {/* Titre */}

          <motion.h1
            variants={staggerItem}
            className="mt-6 font-display text-5xl font-medium leading-[0.98] text-cream sm:text-7xl md:text-8xl"
          >
            Vivez le surnaturel dans{" "}
            <span className="text-gold-gradient">la présence de Dieu</span>
          </motion.h1>

          {/* Description */}

          <motion.p
            variants={staggerItem}
            className="mt-6 max-w-2xl text-base leading-relaxed text-gray-300 sm:text-lg"
          >
            <span className="font-semibold text-cream">
              Le Camp International Silo
            </span>{" "}
            est un rassemblement de réveil qui réunit des adorateurs de
            plusieurs pays pour vivre des moments puissants de communion,
            d'enseignement, de prière et de louange dans la présence de Dieu.
          </motion.p>

          {/* Compte à rebours */}

          <motion.div variants={staggerItem} className="mt-8 md:mt-9">
            <Countdown target={featuredEvent.dateISO} />
          </motion.div>

          {/* CTA */}

          <motion.div
            variants={staggerItem}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Link
              to="/billetterie"
              onClick={() => setEvent(featuredEvent.id)}
              className="btn-gold inline-flex items-center justify-center gap-2 text-base"
            >
              Réserver gratuitement mon billet
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to={`/evenement/${featuredEvent.slug}`}
              className="btn-ghost group inline-flex items-center justify-center gap-2 text-base"
            >
              <Eye className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
              Découvrir l'événement
            </Link>
          </motion.div>

          {/* Stock disponible */}

          <motion.div variants={staggerItem} className="mt-5">
            <div className="inline-flex items-center gap-2 text-sm text-cream-dim">
              {ticketsRemaining > 0 ? (
                <>
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />

                  <span>
                    <span className="font-semibold text-gold-300">
                      {ticketsRemaining}
                    </span>{" "}
                    {ticketsRemaining === 1
                      ? "billet encore disponible"
                      : "billets encore disponibles"}
                  </span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-red-400" />

                  <span className="font-semibold text-red-400">
                    Billets épuisés
                  </span>
                </>
              )}
            </div>
          </motion.div>

          {/* Informations clés */}

          <motion.div
            variants={staggerItem}
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-cream-dim md:gap-x-8"
          >
            <InfoItem icon={<CalendarDays />}>
              {featuredEvent.dateLabel} · {featuredEvent.time}
            </InfoItem>

            <InfoItem icon={<MapPin />}>
              {featuredEvent.venue}, {featuredEvent.city}
            </InfoItem>

            <span className="inline-flex items-center gap-2 text-gold-200">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-300" />

              {featuredEvent.status}
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* =========================================================
   INFO ITEM
========================================================= */

function InfoItem({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-gold-300">{icon}</span>

      {children}
    </span>
  );
}

/* =========================================================
   MARQUEE
========================================================= */

function Marquee() {
  const words = [
    "Camp International Silo",
    "Casablanca 2026",
    "Entrée Gratuite",
    "Prière",
    "Louange",
    "Adoration",
    "Enseignement",
    "Communion",
    "Guérison",
    "Miracles",
    "Présence de Dieu",
    "Réservez votre place",
  ];

  return (
    <section
      className="overflow-hidden border-y border-gold-400/10 bg-ink-950 py-5"
      aria-label="Informations du Camp International Silo"
    >
      <motion.div
        className="flex w-max gap-10 whitespace-nowrap"
        animate={{
          x: ["0%", "-50%"],
        }}
        transition={{
          duration: 90,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {[...words, ...words, ...words].map((word, index) => (
          <span
            key={`${word}-${index}`}
            className="inline-flex items-center gap-10 text-sm uppercase tracking-[0.2em] text-cream-dim"
          >
            {word}

            <span className="text-xl text-gold-400">✦</span>
          </span>
        ))}
      </motion.div>
    </section>
  );
}

/* =========================================================
   STATISTIQUES
========================================================= */

function Stats({ ticketsRemaining }: { ticketsRemaining: number }) {
  const stats = [
    {
      value: "1",
      label: "Ville marocaine",
    },
    {
      value: "1",
      label: "Journée surnaturelle",
    },
    {
      value: ticketsRemaining.toString(),
      label: ticketsRemaining === 1 ? "Place disponible" : "Places disponibles",
    },
    {
      value: "100%",
      label: "Gratuit",
    },
  ];

  return (
    <section className="container-px mx-auto max-w-7xl py-16 md:py-20">
      <Reveal className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-gold-400/10 bg-ink-900/40 px-4 py-6 text-center sm:px-6 sm:py-7"
          >
            <div className="font-display text-4xl font-semibold text-gold-gradient md:text-5xl">
              {stat.value}
            </div>

            <div className="mt-2 text-[10px] uppercase tracking-[0.15em] text-cream-faint sm:text-xs sm:tracking-[0.2em]">
              {stat.label}
            </div>
          </div>
        ))}
      </Reveal>
    </section>
  );
}

/* =========================================================
   EXPÉRIENCE
========================================================= */

function Experience() {
  const pillars = [
    {
      title: "Louange",
      text: "Des chants porteurs, interprétés avec une ferveur et une puissance qui touchent le cœur.",
      icon: <Music className="h-5 w-5" />,
    },
    {
      title: "Communion",
      text: "Une foule rassemblée autour d'une même espérance, dans la joie et l'unité.",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Prière",
      text: "Des temps profonds de prière et d'intercession dans la présence de Dieu.",
      icon: <Sparkles className="h-5 w-5" />,
    },
  ];

  return (
    <section
      id="experience"
      className="container-px mx-auto max-w-7xl scroll-mt-20  py-16 md:py-24"
    >
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        {/* Image */}

        <Reveal>
          <div className="group relative">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-gold-400/5 blur-2xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-gold-400/20 bg-ink-900 shadow-2xl shadow-black/40">
              <img
                src={intimateImg}
                alt="Camp International Silo"
                loading="lazy"
                className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent" />

              {/* Badge */}

              <div className="absolute left-5 top-5 rounded-full border border-gold-400/30 bg-ink-950/70 px-4 py-2 backdrop-blur-md sm:left-6 sm:top-6">
                <span className="text-[10px] uppercase tracking-[0.2em] text-gold-300 sm:text-xs sm:tracking-[0.25em]">
                  Édition 2026
                </span>
              </div>

              {/* Informations */}

              <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-black/60 p-5 backdrop-blur-xl sm:bottom-6 sm:left-6 sm:right-6 sm:p-6">
                <h3 className="font-display text-2xl font-semibold text-white sm:text-3xl">
                  Camp International Silo 2026
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-gray-200">
                  Une journée exceptionnelle de prière, de communion, de louange
                  et d'enseignement dans la présence de Dieu.
                </p>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div>
                    <p className="font-display text-xl text-gold-gradient sm:text-2xl">
                      1500
                    </p>

                    <p className="text-[9px] uppercase tracking-wider text-gray-300 sm:text-xs">
                      Places
                    </p>
                  </div>

                  <div>
                    <p className="font-display text-xl text-gold-gradient sm:text-2xl">
                      100%
                    </p>

                    <p className="text-[9px] uppercase tracking-wider text-gray-300 sm:text-xs">
                      Gratuit
                    </p>
                  </div>

                  <div>
                    <p className="font-display text-xl text-gold-gradient sm:text-2xl">
                      🇲🇦
                    </p>

                    <p className="text-[9px] uppercase tracking-wider text-gray-300 sm:text-xs">
                      Casablanca
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Texte */}

        <div>
          <SectionHeading
            align="left"
            eyebrow="L'expérience"
            title={
              <>
                Bien plus qu'un CAMP,
                <br />
                un <span className="text-gold-gradient">moment surnaturel</span>
              </>
            }
            subtitle="Le Camp International Silo est un rassemblement de réveil qui réunit des adorateurs de plusieurs pays pour vivre des moments puissants de communion, d'enseignement, de prière et de louange dans la présence de Dieu."
          />

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{
              once: true,
              margin: "-70px",
            }}
            className="mt-8 space-y-3"
          >
            {pillars.map((pillar) => (
              <motion.div
                key={pillar.title}
                variants={staggerItem}
                className="group flex gap-4 rounded-2xl border border-transparent p-4 transition-colors hover:border-gold-400/15 hover:bg-ink-900/40"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gold-400/25 text-gold-200">
                  {pillar.icon}
                </div>

                <div>
                  <h3 className="font-display text-xl font-medium text-cream">
                    {pillar.title}
                  </h3>

                  <p className="mt-1 text-sm leading-relaxed text-cream-dim">
                    {pillar.text}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   ÉVÉNEMENT À LA UNE
========================================================= */

function FeaturedEvent({ ticketsRemaining }: { ticketsRemaining: number }) {
  const { setEvent } = useCart();

  return (
    <section
      id="programme"
      className="container-px mx-auto max-w-7xl scroll-mt-20 py-16 md:py-24"
    >
      <Reveal>
        <div className="grid overflow-hidden rounded-[2rem] border border-gold-400/15 bg-ink-900/60 shadow-2xl shadow-black/30 lg:grid-cols-2">
          {/* Image */}

          <div className="relative min-h-[420px] overflow-hidden">
            <img
              src={heroImg}
              alt="Camp International Silo 2026"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

            <span className="absolute left-5 top-5 rounded-full border border-gold-300/30 bg-black/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-200 backdrop-blur sm:left-6 sm:top-6 sm:text-xs sm:tracking-[0.25em]">
              Événement principal
            </span>

            <div className="absolute bottom-6 left-6">
              <p className="text-sm uppercase tracking-[0.25em] text-gold-300">
                Camp International Silo
              </p>

              <h4 className="mt-2 font-display text-2xl text-cream sm:text-3xl">
                Édition 2026
              </h4>
            </div>
          </div>

          {/* Contenu */}

          <div className="flex flex-col justify-center p-6 sm:p-8 md:p-12">
            <span className="text-xs uppercase tracking-[0.3em] text-gold-300">
              {featuredEvent.city} · {featuredEvent.dateLabel}
            </span>

            <h3 className="mt-3 font-display text-3xl font-medium text-cream sm:text-4xl md:text-5xl">
              {featuredEvent.title}
            </h3>

            <p className="mt-2 text-gold-200">{featuredEvent.venue}</p>

            <p className="mt-5 text-sm leading-relaxed text-cream-dim">
              {featuredEvent.shortDesc}
            </p>

            {/* Stock */}

            <div className="mt-6 rounded-2xl border border-gold-400/10 bg-ink-950/40 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-400/10 text-gold-300">
                    <Users className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-cream">
                      Places disponibles
                    </p>

                    <p className="text-xs text-cream-dim">
                      Réservation gratuite
                    </p>
                  </div>
                </div>

                <span className="font-display text-2xl font-semibold text-gold-gradient">
                  {ticketsRemaining}
                </span>
              </div>
            </div>

            {/* CTA */}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/billetterie"
                onClick={() => setEvent(featuredEvent.id)}
                className="btn-gold inline-flex items-center justify-center gap-2"
              >
                Réserver gratuitement
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                to={`/evenement/${featuredEvent.slug}`}
                className="btn-ghost inline-flex items-center justify-center"
              >
                Détails & galerie
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* =========================================================
   PROCHAINS ÉVÉNEMENTS
========================================================= */

function UpcomingEvents() {
  return (
    <section
      id="evenements"
      className="container-px mx-auto max-w-7xl py-16 md:py-24"
    >
      <SectionHeading
        eyebrow="Événements"
        title={
          <>
            Le programme du{" "}
            <span className="text-gold-gradient">Camp International Silo</span>
          </>
        }
        subtitle="Découvrez les temps forts qui vous attendent durant cette édition exceptionnelle : enseignements, louange, prière, communion fraternelle et bien d'autres moments de grâce."
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{
          once: true,
          margin: "-70px",
        }}
        className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        {events.map((event) => (
          <motion.div key={event.id} variants={staggerItem}>
            <EventCard event={event} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

/* =========================================================
   GARANTIES
========================================================= */

function Guarantees() {
  const items = [
    {
      title: "100% Gratuit",
      text: "Réservez votre place gratuitement, sans frais cachés.",
      icon: <CheckCircle2 className="h-5 w-5" />,
    },
    {
      title: "Billet immédiat",
      text: "Recevez votre e-billet avec son QR Code après confirmation.",
      icon: <QrCode className="h-5 w-5" />,
    },
    {
      title: "Contrôle rapide",
      text: "Présentez simplement votre QR Code à l'entrée.",
      icon: <ShieldCheck className="h-5 w-5" />,
    },
    {
      title: "Réservation simple",
      text: "Quelques clics suffisent pour réserver votre participation.",
      icon: <Sparkles className="h-5 w-5" />,
    },
  ];

  return (
    <section
      id="reservation"
      className="container-px mx-auto max-w-7xl py-16 md:py-24"
    >
      <SectionHeading
        eyebrow="En toute confiance"
        title={
          <>
            Une réservation{" "}
            <span className="text-gold-gradient">simple & sereine</span>
          </>
        }
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{
          once: true,
          margin: "-70px",
        }}
        className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {items.map((item) => (
          <motion.div
            key={item.title}
            variants={staggerItem}
            className="group rounded-2xl border border-gold-400/12 bg-ink-900/40 p-6 transition-all duration-500 hover:-translate-y-1 hover:border-gold-400/30"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold-400/20 text-gold-300">
              {item.icon}
            </div>

            <h3 className="mt-5 font-display text-xl font-medium text-cream">
              {item.title}
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-cream-dim">
              {item.text}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

/* =========================================================
   FAQ
========================================================= */

function Faq() {
  const qa = [
    {
      q: "Comment reçois-je mon billet ?",
      a: "Dès la confirmation de votre réservation, votre e-billet avec son QR Code est disponible immédiatement au téléchargement. Il est également envoyé par e-mail et via WhatsApp pour un accès rapide.",
    },
    {
      q: "Puis-je m'inscrire plusieurs fois ?",
      a: "Non, chaque participant peut s'inscrire une seule fois. Une fois votre inscription confirmée, votre e-billet avec QR Code est généré automatiquement pour accéder à l'événement.",
    },
    {
      q: "Que faire le jour de l'événement ?",
      a: "Le jour de l'événement, présentez votre e-billet avec son QR Code sur votre téléphone ou en version imprimée. Un simple scan suffit pour accéder rapidement au site.",
    },
  ];

  const [open, setOpen] = useState<number>(0);

  return (
    <section
      id="faq"
      className="container-px mx-auto max-w-4xl scroll-mt-20 py-16 md:py-24"
    >
      <SectionHeading
        eyebrow="FAQ"
        title="Foire aux questions"
        subtitle="Inscription, réservation, téléchargement de votre e-billet… retrouvez ici toutes les réponses à vos questions."
      />

      <div className="mt-10 space-y-3">
        {qa.map((item, index) => {
          const isOpen = open === index;

          return (
            <Reveal key={item.q} delay={index * 0.05}>
              <div className="overflow-hidden rounded-2xl border border-gold-400/10 bg-ink-900/40">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
                  aria-expanded={isOpen}
                >
                  <span className="font-display text-base text-cream sm:text-lg">
                    {item.q}
                  </span>

                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold-400/30 text-gold-200 transition-transform duration-300 ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>

                <motion.div
                  initial={false}
                  animate={{
                    height: isOpen ? "auto" : 0,
                    opacity: isOpen ? 1 : 0,
                  }}
                  transition={{
                    duration: 0.35,
                    ease: EASE,
                  }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 text-sm leading-relaxed text-cream-dim sm:px-6">
                    {item.a}
                  </p>
                </motion.div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
