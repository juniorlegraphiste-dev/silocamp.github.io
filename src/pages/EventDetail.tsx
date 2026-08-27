/**
 * EventDetail — page détail d'un événement.
 *
 * Hero, faits clés, description, galerie (avec visionneuse)
 * et carte de réservation interactive.
 *
 * La réservation est actuellement 100 % gratuite.
 */

import { useLayoutEffect, useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import { getEventById } from "@/data/events";

import { useCart } from "@/context/CartContext";

import { SectionHeading } from "@/components/SectionHeading";

import { Reveal } from "@/components/Reveal";

import { Countdown } from "@/components/Countdown";

import {
  CalendarDays,
  Clock3,
  MapPin,
  Timer,
} from "lucide-react";

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { setEvent } = useCart();

  const found = id ? getEventById(id) : undefined;

  /*
   * Synchronise l'événement du panier avec celui consulté
   * avant le rendu.
   */

  useLayoutEffect(() => {
    if (found) {
      setEvent(found.id);
    }
  }, [found, setEvent]);

  /*
   * Événement introuvable
   */

  if (!found) {
    return (
      <div className="container-px mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center py-32 text-center">
        <p className="font-display text-5xl text-gold-gradient">
          404
        </p>

        <h1 className="mt-4 font-display text-3xl text-cream">
          Événement introuvable
        </h1>

        <p className="mt-3 text-cream-dim">
          Cet événement n'existe pas ou n'est plus disponible.
        </p>

        <Link
          to="/"
          className="btn-gold mt-8"
        >
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  /*
   * L'événement consulté
   */

  const ev = found;

  return (
    <>
      <Hero ev={ev} />

      <Facts ev={ev} />

      <div className="container-px mx-auto grid max-w-7xl gap-12 py-16 lg:grid-cols-[1.7fr_1fr] lg:gap-14">
        <div className="order-2 lg:order-1">
          <About ev={ev} />

          <Gallery ev={ev} />
        </div>

        <aside className="order-1 lg:order-2">
          <BookingCard
            ev={ev}
            onContinue={() => navigate("/billetterie")}
          />
        </aside>
      </div>
    </>
  );
}

/* =========================================================
   HERO
========================================================= */

function Hero({
  ev,
}: {
  ev: NonNullable<ReturnType<typeof getEventById>>;
}) {
  return (
    <section className="relative grain flex min-h-[70vh] items-end overflow-hidden">
      <motion.img
        src={ev.cover}
        alt={`${ev.title} — ${ev.city}`}
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{
          duration: 10,
          ease: "easeOut",
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/55 to-ink-950/60" />

      <div className="container-px relative z-10 mx-auto w-full max-w-7xl pb-12 pt-32">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-cream-dim transition-colors hover:text-cream"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path
              d="M15 18l-6-6 6-6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          Tous les événements
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-gold-400 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-950">
            {ev.status}
          </span>

          <span className="text-sm uppercase tracking-[0.25em] text-gold-200">
            {ev.city}
          </span>
        </div>

        <h1 className="mt-4 font-display text-5xl font-medium leading-[1] text-cream sm:text-7xl">
          {ev.title}
        </h1>
      </div>
    </section>
  );
}

/* =========================================================
   FAITS CLÉS
========================================================= */

function Facts({
  ev,
}: {
  ev: NonNullable<ReturnType<typeof getEventById>>;
}) {
  const facts = [
    {
      icon: (
        <CalendarDays className="h-5 w-5 text-[#D6AA50] stroke-[1.8]" />
      ),
      label: "Date",
      value: ev.dateLabel,
    },

    {
      icon: (
        <Clock3 className="h-5 w-5 text-[#D6AA50] stroke-[1.8]" />
      ),
      label: "Heure",
      value: `${ev.time} • Portes ${ev.doors}`,
    },

    {
      icon: (
        <Timer className="h-5 w-5 text-[#D6AA50] stroke-[1.8]" />
      ),
      label: "Durée",
      value: ev.duration,
    },

    {
      icon: (
        <MapPin className="h-5 w-5 text-[#D6AA50] stroke-[1.8]" />
      ),
      label: "Lieu",
      value: `${ev.venue}, ${ev.city}`,
    },
  ];

  return (
    <section className="border-y border-gold-400/10 bg-ink-900/40 backdrop-blur">
      <div className="container-px mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-8 py-4 text-sm text-cream">
        {facts.map((fact, index) => (
          <div
            key={index}
            className="flex items-center gap-3"
          >
            {fact.icon}

            <span className="text-cream/90">
              {fact.value}
            </span>

            {index < facts.length - 1 && (
              <span className="ml-5 text-gold-300">
                •
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* =========================================================
   À PROPOS
========================================================= */

function About({
  ev,
}: {
  ev: NonNullable<ReturnType<typeof getEventById>>;
}) {
  return (
    <section>
      <SectionHeading
        align="left"
        eyebrow="À propos"
        title="L'événement"
        className="mb-8"
      />

      <div className="space-y-5 text-base leading-relaxed text-cream-dim">
        {ev.description.map((p, i) => (
          <Reveal
            key={i}
            delay={i * 0.05}
          >
            <p>{p}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* =========================================================
   GALERIE + VISIONNEUSE
========================================================= */

function Gallery({
  ev,
}: {
  ev: NonNullable<ReturnType<typeof getEventById>>;
}) {
  const [active, setActive] = useState<number | null>(
    null,
  );

  return (
    <section className="mt-16">
      <SectionHeading
        align="left"
        eyebrow="En images"
        title="Galerie"
        className="mb-8"
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {ev.gallery.map((src, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`group relative overflow-hidden rounded-2xl border border-gold-400/10 ${
              i === 0
                ? "col-span-2 aspect-[16/9]"
                : "aspect-square"
            }`}
            aria-label={`Ouvrir l'image ${i + 1}`}
          >
            <img
              src={src}
              alt={`Galerie Camp International Silo ${i + 1}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-ink-950/0 transition-colors group-hover:bg-ink-950/20" />
          </button>
        ))}
      </div>

      {/* Visionneuse */}

      <AnimatePresence>
        {active !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-950/90 p-4 backdrop-blur"
            onClick={() => setActive(null)}
          >
            <button
              className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full border border-gold-400/30 text-cream"
              onClick={() => setActive(null)}
              aria-label="Fermer"
            >
              ✕
            </button>

            <button
              className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full border border-gold-400/30 text-cream"
              onClick={(e) => {
                e.stopPropagation();

                setActive((p) =>
                  p === null
                    ? 0
                    : (p - 1 + ev.gallery.length) %
                      ev.gallery.length,
                );
              }}
              aria-label="Précédent"
            >
              ‹
            </button>

            <motion.img
              key={active}
              src={ev.gallery[active]}
              alt={`Galerie Camp International Silo ${
                active + 1
              }`}
              initial={{
                scale: 0.92,
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              transition={{
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="max-h-[82vh] max-w-[90vw] rounded-2xl object-contain"
              onClick={(e) =>
                e.stopPropagation()
              }
            />

            <button
              className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full border border-gold-400/30 text-cream"
              onClick={(e) => {
                e.stopPropagation();

                setActive((p) =>
                  p === null
                    ? 0
                    : (p + 1) % ev.gallery.length,
                );
              }}
              aria-label="Suivant"
            >
              ›
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* =========================================================
   CARTE DE RÉSERVATION
========================================================= */

function BookingCard({
  ev,
  onContinue,
}: {
  ev: NonNullable<ReturnType<typeof getEventById>>;
  onContinue: () => void;
}) {
  const {
    quantities,
    increment,
    decrement,
    count,
  } = useCart();

  return (
    <div className="lg:sticky lg:top-24">
      <div className="glass overflow-hidden rounded-3xl">
        {/* HEADER */}

        <div className="border-b border-gold-400/12 p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl font-medium text-cream">
              Réserver gratuitement
            </h3>

            <span className="text-xs uppercase tracking-wider text-gold-300">
              {ev.city}
            </span>
          </div>

          <div className="mt-4">
            <Countdown
              target={ev.dateISO}
              className="!gap-2"
            />
          </div>
        </div>

        {/* FORMULES */}

        <div className="max-h-[24rem] overflow-y-auto p-6">
          {(() => {
            const c = ev.categories[0];

            if (!c) {
              return null;
            }

            const qty = quantities[c.id] ?? 0;

            return (
              <div
                className={`rounded-2xl border p-4 transition-colors ${
                  qty > 0
                    ? "border-gold-400/40 bg-gold-400/5"
                    : "border-gold-400/12 bg-ink-950/30"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg font-medium text-cream">
                        Participation
                      </span>

                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                        Gratuit
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-relaxed text-cream-faint">
                      Réservez gratuitement votre place et
                      recevez instantanément votre e-billet
                      avec QR Code.
                    </p>
                  </div>

                  <div className="flex shrink-0">
                    {qty === 0 ? (
                      <button
                        onClick={() => increment(c.id)}
                        className="inline-flex h-10 items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-4 text-xs font-semibold text-gold-300 transition hover:border-gold-400 hover:bg-gold-400/20"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M12 5v14M5 12h14" />
                        </svg>

                        Réserver
                      </button>
                    ) : (
                      <button
                        onClick={() => decrement(c.id)}
                        className="inline-flex h-10 items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>

                        Sélectionnée
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-cream-faint">
                  <span className="rounded-full border border-gold-400/15 px-2 py-1">
                    ✓ Réservation gratuite
                  </span>

                  <span className="rounded-full border border-gold-400/15 px-2 py-1">
                    ✓ E-billet
                  </span>

                  <span className="rounded-full border border-gold-400/15 px-2 py-1">
                    ✓ QR Code sécurisé
                  </span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* TOTAL + CTA */}

        <div className="border-t border-gold-400/12 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-cream-dim">
              {count > 0
                ? `${count} place${
                    count > 1 ? "s" : ""
                  } sélectionnée${
                    count > 1 ? "s" : ""
                  }`
                : "Aucune place sélectionnée"}
            </span>

            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-300">
              100 % Gratuit
            </span>
          </div>

          <button
            onClick={onContinue}
            disabled={count === 0}
            className="btn-gold mt-4 w-full disabled:cursor-not-allowed disabled:opacity-40"
          >
            Réserver gratuitement
          </button>

          <div className="mt-5 space-y-3 text-sm" />

          <p className="mt-3 text-center text-[11px] text-cream-faint">
            Réservation gratuite • E-billet avec QR Code
            envoyé immédiatement
          </p>
        </div>
      </div>
    </div>
  );
}