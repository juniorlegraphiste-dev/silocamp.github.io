import {
  CalendarDays,
  CheckCircle2,
  Save,
  Settings,
  Users,
} from "lucide-react";
import { useState } from "react";

export default function AdminSettings() {
  const [eventName, setEventName] = useState(
    "Camp International Silo 2026"
  );
  const [eventDate, setEventDate] = useState("2026-09-22");
  const [eventTime, setEventTime] = useState("09:00");
  const [eventLocation, setEventLocation] = useState("");
  const [capacity, setCapacity] = useState("1200");

  const [eventSaved, setEventSaved] = useState(false);
  const [capacitySaved, setCapacitySaved] = useState(false);

  const handleSaveEvent = () => {
    setEventSaved(true);

    setTimeout(() => {
      setEventSaved(false);
    }, 3000);
  };

  const handleSaveCapacity = () => {
    const value = Number(capacity);

    if (!Number.isInteger(value) || value < 1) {
      return;
    }

    setCapacitySaved(true);

    setTimeout(() => {
      setCapacitySaved(false);
    }, 3000);
  };

  return (
    <div className="container-px mx-auto max-w-5xl pb-24 pt-10 lg:pt-12">
      {/* HEADER */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-gold-400/20 bg-gold-400/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-gold-300">
          <Settings className="h-4 w-4" />
          Configuration
        </div>

        <h1 className="mt-5 font-display text-4xl text-cream">
          Paramètres
        </h1>

        <p className="mt-3 text-cream-dim">
          Configurez les informations générales de SiloCamp.
        </p>
      </div>

      <div className="space-y-6">
        {/* ====================================================== */}
        {/* ÉVÉNEMENT */}
        {/* ====================================================== */}

        <section className="rounded-3xl border border-gold-400/10 bg-ink-900/40 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold-400/10 text-gold-300">
              <CalendarDays className="h-6 w-6" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="font-display text-xl text-cream">
                Événement
              </h2>

              <p className="mt-2 text-sm text-cream-dim">
                Configurez les informations générales de l'événement
                SiloCamp.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-5">
            {/* NOM */}
            <div>
              <label
                htmlFor="event-name"
                className="mb-2 block text-sm font-medium text-cream"
              >
                Nom de l'événement
              </label>

              <input
                id="event-name"
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Nom de l'événement"
                className="w-full rounded-2xl border border-gold-400/10 bg-ink-950/60 px-4 py-3 text-sm text-cream outline-none transition placeholder:text-cream-dim/50 focus:border-gold-400/40 focus:ring-2 focus:ring-gold-400/10"
              />
            </div>

            {/* DATE + HEURE */}
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="event-date"
                  className="mb-2 block text-sm font-medium text-cream"
                >
                  Date
                </label>

                <input
                  id="event-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full rounded-2xl border border-gold-400/10 bg-ink-950/60 px-4 py-3 text-sm text-cream outline-none transition focus:border-gold-400/40 focus:ring-2 focus:ring-gold-400/10"
                />
              </div>

              <div>
                <label
                  htmlFor="event-time"
                  className="mb-2 block text-sm font-medium text-cream"
                >
                  Heure
                </label>

                <input
                  id="event-time"
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full rounded-2xl border border-gold-400/10 bg-ink-950/60 px-4 py-3 text-sm text-cream outline-none transition focus:border-gold-400/40 focus:ring-2 focus:ring-gold-400/10"
                />
              </div>
            </div>

            {/* LIEU */}
            <div>
              <label
                htmlFor="event-location"
                className="mb-2 block text-sm font-medium text-cream"
              >
                Lieu
              </label>

              <input
                id="event-location"
                type="text"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="Lieu de l'événement"
                className="w-full rounded-2xl border border-gold-400/10 bg-ink-950/60 px-4 py-3 text-sm text-cream outline-none transition placeholder:text-cream-dim/50 focus:border-gold-400/40 focus:ring-2 focus:ring-gold-400/10"
              />
            </div>

            {/* ACTION */}
            <div className="flex flex-col gap-3 border-t border-gold-400/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs text-cream-dim">
                {eventSaved && (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Modifications enregistrées.</span>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={handleSaveEvent}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gold-400 px-5 py-3 text-sm font-semibold text-ink-950 transition hover:bg-gold-300"
              >
                <Save className="h-4 w-4" />
                Enregistrer les modifications
              </button>
            </div>
          </div>
        </section>

        {/* ====================================================== */}
        {/* CAPACITÉ */}
        {/* ====================================================== */}

        <section className="rounded-3xl border border-gold-400/10 bg-ink-900/40 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold-400/10 text-gold-300">
              <Users className="h-6 w-6" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="font-display text-xl text-cream">
                Capacité
              </h2>

              <p className="mt-2 text-sm text-cream-dim">
                Gérez la capacité maximale de l'événement.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <label
              htmlFor="capacity"
              className="mb-2 block text-sm font-medium text-cream"
            >
              Capacité maximale
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <input
                  id="capacity"
                  type="number"
                  min="1"
                  step="1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full rounded-2xl border border-gold-400/10 bg-ink-950/60 px-4 py-3 text-sm text-cream outline-none transition focus:border-gold-400/40 focus:ring-2 focus:ring-gold-400/10"
                />

                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-cream-dim">
                  participants
                </span>
              </div>

              <button
                type="button"
                onClick={handleSaveCapacity}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gold-400 px-5 py-3 text-sm font-semibold text-ink-950 transition hover:bg-gold-300"
              >
                <Save className="h-4 w-4" />
                Enregistrer
              </button>
            </div>

            <p className="mt-3 text-xs leading-5 text-cream-dim">
              Cette valeur correspond au nombre maximal de participants
              pouvant être enregistrés pour SiloCamp.
            </p>

            {capacitySaved && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Capacité enregistrée.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}