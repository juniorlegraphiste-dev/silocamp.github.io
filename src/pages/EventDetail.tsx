
/**
 * EventDetail — page détail d'un événement.
 *
 * Hero, faits clés, description, galerie avec visionneuse
 * et carte de réservation interactive.
 *
 * Réservation actuellement 100 % gratuite.
 * Responsive : mobile, tablette et ordinateur.
 */

import { useEffect, useLayoutEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Clock3,
  MapPin,
  Timer,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowLeft,
  Plus,
  Check,
} from "lucide-react";

import { getEventById } from "@/data/events";
import { useCart } from "@/context/CartContext";
import { SectionHeading } from "@/components/SectionHeading";
import { Reveal } from "@/components/Reveal";
import { Countdown } from "@/components/Countdown";

/* =========================================================
   TYPES
========================================================= */

type EventData = NonNullable<ReturnType<typeof getEventById>>;

/* =========================================================
   PAGE PRINCIPALE
========================================================= */

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setEvent } = useCart();

  const found = id ? getEventById(id) : undefined;

  useLayoutEffect(() => {
    if (found) {
      setEvent(found.id);
    }
  }, [found, setEvent]);

  if (!found) {
    return (
      <main className="container-px mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center py-20 text-center sm:py-32">
        <p className="font-display text-5xl text-gold-gradient sm:text-7xl">
          404
        </p>

        <h1 className="mt-4 max-w-full break-words font-display text-2xl text-cream sm:text-3xl">
          Événement introuvable
        </h1>

        <p className="mt-3 max-w-md text-sm leading-relaxed text-cream-dim sm:text-base">
          Cet événement n'existe pas ou n'est plus disponible.
        </p>

        <Link to="/" className="btn-gold mt-8">
          <ArrowLeft className="mr-2 inline h-4 w-4" />
          Retour à l'accueil
        </Link>
      </main>
    );
  }

  const ev = found;

  return (
    <main className="w-full min-w-0 overflow-x-clip">
      <Hero ev={ev} />
      <Facts ev={ev} />

      <div className="container-px mx-auto grid w-full min-w-0 max-w-7xl grid-cols-1 gap-8 py-8 sm:gap-10 sm:py-12 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-14 lg:py-16">
        <div className="order-2 min-w-0 lg:order-1">
          <About ev={ev} />
          <Gallery ev={ev} />
        </div>

        <aside className="order-1 min-w-0 lg:order-2">
          <BookingCard
            ev={ev}
            onContinue={() => navigate("/billetterie")}
          />
        </aside>
      </div>
    </main>
  );
}

/* =========================================================
   HERO
========================================================= */

function Hero({ ev }: { ev: EventData }) {
  return (
    <section className="grain relative flex min-h-[460px] items-end overflow-hidden sm:min-h-[540px] lg:min-h-[70vh]">
      <motion.img
        src={ev.cover}
        alt={`${ev.title} — ${ev.city}`}
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover"
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ duration: 8, ease: "easeOut" }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/65 to-ink-950/40" />

      <div className="container-px relative z-10 mx-auto w-full max-w-7xl pb-8 pt-28 sm:pb-12 sm:pt-32 lg:pb-16">
        <Link
          to="/"
          className="mb-6 inline-flex min-h-10 max-w-full items-center gap-2 text-sm text-cream-dim transition-colors hover:text-cream"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span>Tous les événements</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="max-w-full break-words rounded-full bg-gold-400 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-950 sm:text-[11px]">
            {ev.status}
          </span>

          <span className="break-words text-xs uppercase tracking-[0.16em] text-gold-200 sm:text-sm sm:tracking-[0.25em]">
            {ev.city}
          </span>
        </div>

        <h1 className="mt-4 max-w-4xl break-words font-display text-3xl font-medium leading-tight text-cream [overflow-wrap:anywhere] min-[400px]:text-4xl sm:text-6xl sm:leading-[1.05] lg:text-7xl">
          {ev.title}
        </h1>
      </div>
    </section>
  );
}

/* =========================================================
   FAITS CLÉS
========================================================= */

function Facts({ ev }: { ev: EventData }) {
  const facts = [
    {
      icon: <CalendarDays className="h-5 w-5 shrink-0 text-[#D6AA50]" />,
      label: "Date",
      value: ev.dateLabel,
    },
    {
      icon: <Clock3 className="h-5 w-5 shrink-0 text-[#D6AA50]" />,
      label: "Heure",
      value: `${ev.time} • Ouverture des portes ${ev.doors}`,
    },
    {
      icon: <Timer className="h-5 w-5 shrink-0 text-[#D6AA50]" />,
      label: "Durée",
      value: ev.duration,
    },
    {
      icon: <MapPin className="h-5 w-5 shrink-0 text-[#D6AA50]" />,
      label: "Lieu",
      value: `${ev.venue}, ${ev.city}`,
    },
  ];

  return (
    <section className="border-y border-gold-400/10 bg-ink-900/40 backdrop-blur">
      <div className="container-px mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 py-5 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-6">
        {facts.map((fact) => (
          <div
            key={fact.label}
            className="flex min-w-0 items-start gap-3"
          >
            <div className="mt-0.5">{fact.icon}</div>

            <div className="min-w-0 flex-1">
              <p className="text-xs text-cream-faint">{fact.label}</p>
              <p className="mt-1 break-words text-sm leading-relaxed text-cream [overflow-wrap:anywhere]">
                {fact.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* =========================================================
   À PROPOS
========================================================= */

function About({ ev }: { ev: EventData }) {
  return (
    <section className="min-w-0">
      <SectionHeading
        align="left"
        eyebrow="À propos"
        title="L'événement"
        className="mb-6 sm:mb-8"
      />

      <div className="space-y-4 text-sm leading-relaxed text-cream-dim sm:space-y-5 sm:text-base">
        {ev.description.map((paragraph, index) => (
          <Reveal key={index} delay={index * 0.05}>
            <p className="break-words [overflow-wrap:anywhere]">
              {paragraph}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* =========================================================
   GALERIE ET VISIONNEUSE
========================================================= */

function Gallery({ ev }: { ev: EventData }) {
  const [active, setActive] = useState<number | null>(null);

  const closeGallery = () => setActive(null);

  const showPrevious = () => {
    setActive((current) =>
      current === null
        ? 0
        : (current - 1 + ev.gallery.length) % ev.gallery.length,
    );
  };

  const showNext = () => {
    setActive((current) =>
      current === null ? 0 : (current + 1) % ev.gallery.length,
    );
  };

  useEffect(() => {
    if (active === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeGallery();
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [active, ev.gallery.length]);

  return (
    <section className="mt-12 min-w-0 sm:mt-16">
      <SectionHeading
        align="left"
        eyebrow="En images"
        title="Galerie"
        className="mb-6 sm:mb-8"
      />

      <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-4">
        {ev.gallery.map((src, index) => (
          <button
            key={`${src}-${index}`}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`Ouvrir l'image ${index + 1}`}
            className={`group relative min-w-0 overflow-hidden rounded-xl border border-gold-400/10 sm:rounded-2xl ${
              index === 0
                ? "col-span-2 aspect-[16/9]"
                : "aspect-square"
            }`}
          >
            <img
              src={src}
              alt={`Galerie Camp International Silo ${index + 1}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            <span className="absolute inset-0 bg-ink-950/0 transition-colors group-hover:bg-ink-950/20" />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {active !== null && ev.gallery[active] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-950/95 p-3 backdrop-blur sm:p-6"
            onClick={closeGallery}
            role="dialog"
            aria-modal="true"
            aria-label="Visionneuse de la galerie"
          >
            <button
              type="button"
              onClick={closeGallery}
              aria-label="Fermer la galerie"
              className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-gold-400/30 bg-ink-950/60 text-cream transition hover:bg-ink-900 sm:right-6 sm:top-6"
            >
              <X className="h-5 w-5" />
            </button>

            {ev.gallery.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    showPrevious();
                  }}
                  aria-label="Image précédente"
                  className="absolute left-2 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-gold-400/30 bg-ink-950/60 text-cream transition hover:bg-ink-900 sm:left-5 sm:h-12 sm:w-12"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    showNext();
                  }}
                  aria-label="Image suivante"
                  className="absolute right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-gold-400/30 bg-ink-950/60 text-cream transition hover:bg-ink-900 sm:right-5 sm:h-12 sm:w-12"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            <motion.img
              key={active}
              src={ev.gallery[active]}
              alt={`Galerie Camp International Silo ${active + 1}`}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="max-h-[75dvh] max-w-[calc(100vw-2rem)] rounded-xl object-contain sm:max-h-[82vh] sm:max-w-[90vw] sm:rounded-2xl"
              onClick={(event) => event.stopPropagation()}
            />

            <p className="absolute bottom-3 left-0 right-0 text-center text-xs text-cream-dim sm:bottom-5">
              Image {active + 1} sur {ev.gallery.length}
            </p>
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
  ev: EventData;
  onContinue: () => void;
}) {
  const { quantities, increment, decrement, count } = useCart();

  const category = ev.categories[0];
  const quantity = category ? quantities[category.id] ?? 0 : 0;

  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl lg:sticky lg:top-24 lg:max-w-none">
      <div className="glass w-full min-w-0 overflow-hidden rounded-2xl sm:rounded-3xl">
        {/* En-tête */}
        <div className="border-b border-gold-400/12 p-4 sm:p-6">
          <div className="flex flex-col items-start gap-2 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between">
            <h2 className="font-display text-xl font-medium leading-snug text-cream sm:text-2xl">
              Réserver gratuitement
            </h2>

            <span className="max-w-full break-words text-xs uppercase tracking-wider text-gold-300">
              {ev.city}
            </span>
          </div>

          <div className="mt-4 min-w-0">
            <Countdown target={ev.dateISO} className="!gap-2" />
          </div>
        </div>

        {/* Formule */}
        <div className="p-4 sm:p-6">
          {category ? (
            <div
              className={`min-w-0 rounded-2xl border p-3 transition-colors sm:p-4 ${
                quantity > 0
                  ? "border-gold-400/40 bg-gold-400/5"
                  : "border-gold-400/12 bg-ink-950/30"
              }`}
            >
              <div className="flex min-w-0 flex-col gap-4 min-[400px]:flex-row min-[400px]:items-start min-[400px]:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-medium text-cream">
                      Participation
                    </h3>

                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                      Gratuit
                    </span>
                  </div>

                  <p className="mt-2 break-words text-sm leading-relaxed text-cream-faint">
                    Réservez gratuitement votre place et recevez votre
                    e-billet avec QR Code.
                  </p>
                </div>

                <div className="flex w-full shrink-0 min-[400px]:w-auto">
                  {quantity === 0 ? (
                    <button
                      type="button"
                      onClick={() => increment(category.id)}
                      className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-4 py-2 text-xs font-semibold text-gold-300 transition hover:border-gold-400 hover:bg-gold-400/20 min-[400px]:w-auto"
                    >
                      <Plus className="h-4 w-4" />
                      Réserver
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => decrement(category.id)}
                      className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20 min-[400px]:w-auto"
                    >
                      <Check className="h-4 w-4" />
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
          ) : (
            <p className="text-sm leading-relaxed text-cream-dim">
              Aucune formule de participation n'est actuellement disponible.
            </p>
          )}
        </div>

        {/* Total et action */}
        <div className="border-t border-gold-400/12 p-4 sm:p-6">
          <div className="flex flex-col items-start gap-3 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between">
            <span className="text-sm leading-relaxed text-cream-dim">
              {count > 0
                ? `${count} place${count > 1 ? "s" : ""} sélectionnée${count > 1 ? "s" : ""}`
                : "Aucune place sélectionnée"}
            </span>

            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-300">
              100 % Gratuit
            </span>
          </div>

          <button
            type="button"
            onClick={onContinue}
            disabled={count === 0}
            className="btn-gold mt-4 flex min-h-12 w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Réserver gratuitement
            <ChevronRight className="h-4 w-4" />
          </button>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-cream-faint">
            Réservation gratuite • E-billet avec QR Code envoyé immédiatement
          </p>
        </div>
      </div>
    </div>
  );
}