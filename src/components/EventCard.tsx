/**
 * EventCard — carte d'aperçu d'un événement (image, date, lieu, prix).
 * Au survol : léger zoom de l'image et remontée de la carte.
 */
import { Link } from "react-router-dom";
import type { EventItem } from "@/data/events";
import { formatMAD } from "@/utils/format";

export function EventCard({ event }: { event: EventItem }) {
  const minPrice = 0;
  const date = new Date(event.dateISO);

  return (
    <Link
      to={`/evenement/${event.slug}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-gold-400/10 bg-ink-900/60 transition-all duration-500 hover:-translate-y-1.5 hover:border-gold-400/30 hover:shadow-2xl hover:shadow-black/40"
    >
      {/* Visuel */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={event.cover}
          alt={`${event.title} — ${event.city}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent" />

        {/* Badges */}
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {event.featured && (
            <span className="rounded-full bg-gold-400 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-950">
              À la une
            </span>
          )}
        </div>
        <span className="absolute right-4 top-4 rounded-full border border-gold-400/30 bg-ink-950/60 px-3 py-1 text-[11px] font-medium text-gold-200 backdrop-blur">
          {event.status}
        </span>

        {/* Date */}
        <div className="absolute bottom-4 left-4 flex items-end gap-3">
          <div className="rounded-xl border border-gold-400/30 bg-ink-950/70 px-2.5 py-1.5 text-center backdrop-blur">
            <div className="font-display text-2xl font-semibold leading-none text-cream">
              {String(date.getDate()).padStart(2, "0")}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-gold-300">
              {date.toLocaleDateString("fr-FR", { month: "short" })}
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 backdrop-blur-md">
  <svg
    viewBox="0 0 24 24"
    className="h-3.5 w-3.5 text-gold-300"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path
      d="M12 2v4M12 12l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>

  <span className="text-[11px] font-medium text-white">
    {event.time}
  </span>

  <span className="h-1 w-1 rounded-full bg-gold-300" />

  <svg
    viewBox="0 0 24 24"
    className="h-3.5 w-3.5 text-gold-300"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path
      d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="10" r="2.5" />
  </svg>

  <span className="text-[11px] font-medium text-white">
    {event.city}
  </span>
</div>
        </div>
      </div>

      {/* Contenu */}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-2xl font-medium text-cream">
          {event.title}
        </h3>
        <p className="mt-1 text-sm text-gold-300">{event.artist}</p>
        <p className="mt-3 text-sm leading-relaxed text-cream-dim">
          {event.venue} · {event.city}
        </p>

        <div className="mt-5 flex items-center justify-between border-t border-gold-400/10 pt-5">
  <div>
    <span className="text-[10px] uppercase tracking-[0.25em] text-cream-faint">
      Billetterie
    </span>

    <div className="mt-1 flex items-center gap-2">
      <span className="font-display text-xl font-semibold text-emerald-300">
        100 % GRATUITE
      </span>
    </div>

    <p className="mt-1 text-xs text-gold-300">
      Réservation immédiate • Sans frais
    </p>
  </div>

  <Link
    to={`/evenement/${event.slug}`}
    className="inline-flex items-center gap-2 rounded-full bg-gold-400 px-4 py-2 text-xs font-semibold text-ink-950 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-300 hover:shadow-lg hover:shadow-gold-400/20"
  >
    Réserver

    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        d="M5 12h14M13 6l6 6-6 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </Link>
</div>
      </div>
    </Link>
  );
}
