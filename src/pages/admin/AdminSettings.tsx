import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  Save,
  Settings,
  Users,
  XCircle,
} from "lucide-react";

type EventSettings = {
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  capacity: number;
  registrationsOpen: boolean;
};

type TicketStats = {
  capacity: number;
  reserved: number;
  remaining: number;
  totalTickets: number;
  validTickets: number;
  usedTickets: number;
  cancelledTickets: number;
  registrationsOpen: boolean;
};

const DEFAULT_SETTINGS: EventSettings = {
  eventName: "Camp International Silo 2026",
  eventDate: "2026-09-22",
  eventTime: "09:00",
  eventLocation: "Casablanca, Maroc",
  capacity: 1200,
  registrationsOpen: true,
};

function formatDate(date: string): string {
  if (!date) {
    return "—";
  }

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function normalizeSettings(
  value: Partial<EventSettings>,
): EventSettings {
  return {
    eventName:
      typeof value.eventName === "string"
        ? value.eventName
        : DEFAULT_SETTINGS.eventName,

    eventDate:
      typeof value.eventDate === "string"
        ? value.eventDate
        : DEFAULT_SETTINGS.eventDate,

    eventTime:
      typeof value.eventTime === "string"
        ? value.eventTime
        : DEFAULT_SETTINGS.eventTime,

    eventLocation:
      typeof value.eventLocation === "string"
        ? value.eventLocation
        : DEFAULT_SETTINGS.eventLocation,

    capacity:
      Number.isFinite(Number(value.capacity)) &&
      Number(value.capacity) > 0
        ? Number(value.capacity)
        : DEFAULT_SETTINGS.capacity,

    registrationsOpen:
      typeof value.registrationsOpen === "boolean"
        ? value.registrationsOpen
        : DEFAULT_SETTINGS.registrationsOpen,
  };
}

export default function AdminSettings() {
  const [settings, setSettings] =
    useState<EventSettings>(DEFAULT_SETTINGS);

  const [stats, setStats] = useState<TicketStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      setLoading(true);
      setError("");

      try {
        const [settingsResponse, statsResponse] =
          await Promise.all([
            fetch("/api/settings", {
              method: "GET",
              credentials: "include",
              headers: {
                Accept: "application/json",
              },
              cache: "no-store",
            }),

            fetch("/api/tickets/stats", {
              method: "GET",
              credentials: "include",
              headers: {
                Accept: "application/json",
              },
              cache: "no-store",
            }),
          ]);

        const settingsData =
          await settingsResponse.json().catch(() => null);

        const statsData =
          await statsResponse.json().catch(() => null);

        if (!settingsResponse.ok || !settingsData?.ok) {
          throw new Error(
            settingsData?.error ||
              "Impossible de charger les paramètres de l'événement.",
          );
        }

        if (!mounted) {
          return;
        }

        setSettings(
          normalizeSettings(settingsData.settings ?? {}),
        );

        if (
          statsResponse.ok &&
          statsData?.ok &&
          statsData?.stats
        ) {
          setStats(statsData.stats);
        }
      } catch (err) {
        console.error(
          "[SiloCamp] Chargement des paramètres :",
          err,
        );

        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Impossible de charger les paramètres.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  const updateField = <K extends keyof EventSettings>(
    field: K,
    value: EventSettings[K],
  ) => {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSave = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const eventName = settings.eventName.trim();
    const eventLocation = settings.eventLocation.trim();
    const capacity = Number(settings.capacity);

    if (!eventName) {
      setError(
        "Le nom de l'événement est obligatoire.",
      );
      return;
    }

    if (!settings.eventDate) {
      setError(
        "La date de l'événement est obligatoire.",
      );
      return;
    }

    if (!settings.eventTime) {
      setError(
        "L'heure de l'événement est obligatoire.",
      );
      return;
    }

    if (!eventLocation) {
      setError(
        "Le lieu de l'événement est obligatoire.",
      );
      return;
    }

    if (
      !Number.isInteger(capacity) ||
      capacity < 1
    ) {
      setError(
        "La capacité doit être un nombre entier supérieur ou égal à 1.",
      );
      return;
    }

    if (stats && capacity < stats.reserved) {
      setError(
        `La capacité ne peut pas être inférieure aux ${stats.reserved} places déjà réservées.`,
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          eventName,
          eventDate: settings.eventDate,
          eventTime: settings.eventTime,
          eventLocation,
          capacity,
          registrationsOpen:
            settings.registrationsOpen,
        }),
      });

      const data =
        await response.json().catch(() => null);

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.error ||
            "Impossible d'enregistrer les paramètres de l'événement.",
        );
      }

      setSettings(
        normalizeSettings(
          data.settings ?? settings,
        ),
      );

      if (data.stats) {
        setStats(data.stats);
      } else {
        setStats((current) =>
          current
            ? {
                ...current,
                capacity,
                remaining: Math.max(
                  0,
                  capacity - current.reserved,
                ),
                registrationsOpen:
                  settings.registrationsOpen,
              }
            : current,
        );
      }

      setSuccess(
        "Les paramètres de SiloCamp ont été enregistrés.",
      );
    } catch (err) {
      console.error(
        "[SiloCamp] Enregistrement des paramètres :",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'enregistrer les paramètres.",
      );
    } finally {
      setSaving(false);
    }
  };

  const reserved = stats?.reserved ?? 0;

  const remaining =
    stats?.remaining ??
    Math.max(
      0,
      settings.capacity - reserved,
    );

  const capacityPercent =
    settings.capacity > 0
      ? Math.min(
          100,
          Math.round(
            (reserved / settings.capacity) * 100,
          ),
        )
      : 0;

  if (loading) {
    return (
      <div className="container-px mx-auto max-w-5xl pb-24 pt-10 lg:pt-12">
        <div className="flex min-h-[420px] items-center justify-center">
          <div className="flex items-center gap-3 text-cream-dim">
            <Loader2 className="h-5 w-5 animate-spin text-[#d4ae63]" />

            <span>
              Chargement des paramètres...
            </span>
          </div>
        </div>
      </div>
    );
  }

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
          Configurez les informations générales de
          SiloCamp.
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <p>{error}</p>
        </div>
      )}

      {/* SUCCESS */}
      {success && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

          <p>{success}</p>
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="space-y-6"
      >
        {/* ÉVÉNEMENT */}
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
                Modifiez les informations principales
                affichées sur SiloCamp.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {/* NOM */}
            <div className="md:col-span-2">
              <label
                htmlFor="eventName"
                className="mb-2 block text-sm font-medium text-cream"
              >
                Nom de l'événement
              </label>

              <input
                id="eventName"
                type="text"
                value={settings.eventName}
                onChange={(event) =>
                  updateField(
                    "eventName",
                    event.target.value,
                  )
                }
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-cream outline-none transition placeholder:text-cream-dim/50 focus:border-[#d4ae63]/60"
                placeholder="Camp International Silo 2026"
                maxLength={200}
              />
            </div>

            {/* DATE */}
            <div>
              <label
                htmlFor="eventDate"
                className="mb-2 flex items-center gap-2 text-sm font-medium text-cream"
              >
                <CalendarDays className="h-4 w-4 text-[#d4ae63]" />

                Date
              </label>

              <input
                id="eventDate"
                type="date"
                value={settings.eventDate}
                onChange={(event) =>
                  updateField(
                    "eventDate",
                    event.target.value,
                  )
                }
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-cream outline-none transition focus:border-[#d4ae63]/60"
              />
            </div>

            {/* HEURE */}
            <div>
              <label
                htmlFor="eventTime"
                className="mb-2 flex items-center gap-2 text-sm font-medium text-cream"
              >
                <Clock3 className="h-4 w-4 text-[#d4ae63]" />

                Heure
              </label>

              <input
                id="eventTime"
                type="time"
                value={settings.eventTime}
                onChange={(event) =>
                  updateField(
                    "eventTime",
                    event.target.value,
                  )
                }
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-cream outline-none transition focus:border-[#d4ae63]/60"
              />
            </div>

            {/* LIEU */}
            <div className="md:col-span-2">
              <label
                htmlFor="eventLocation"
                className="mb-2 flex items-center gap-2 text-sm font-medium text-cream"
              >
                <MapPin className="h-4 w-4 text-[#d4ae63]" />

                Lieu
              </label>

              <input
                id="eventLocation"
                type="text"
                value={settings.eventLocation}
                onChange={(event) =>
                  updateField(
                    "eventLocation",
                    event.target.value,
                  )
                }
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-cream outline-none transition placeholder:text-cream-dim/50 focus:border-[#d4ae63]/60"
                placeholder="Casablanca, Maroc"
                maxLength={200}
              />
            </div>
          </div>
        </section>

        {/* CAPACITÉ */}
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
                Définissez le nombre maximum de places
                disponibles.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {/* CAPACITÉ MAX */}
            <div>
              <label
                htmlFor="capacity"
                className="mb-2 block text-sm font-medium text-cream"
              >
                Capacité maximale
              </label>

              <input
                id="capacity"
                type="number"
                min={Math.max(1, reserved)}
                step={1}
                value={settings.capacity}
                onChange={(event) =>
                  updateField(
                    "capacity",
                    Number(event.target.value),
                  )
                }
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-cream outline-none transition focus:border-[#d4ae63]/60"
              />

              <p className="mt-2 text-xs text-cream-dim">
                Réservé actuellement : {reserved} place
                {reserved > 1 ? "s" : ""}.
              </p>
            </div>

            {/* PLACES RESTANTES */}
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-cream-dim">
                  Places restantes
                </span>

                <span className="text-2xl font-semibold text-[#d4ae63]">
                  {remaining}
                </span>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#d4ae63] transition-all"
                  style={{
                    width: `${capacityPercent}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-xs text-cream-dim">
                {capacityPercent}% de la capacité est
                actuellement réservée.
              </p>
            </div>
          </div>
        </section>

        {/* INSCRIPTIONS */}
        <section className="rounded-3xl border border-gold-400/10 bg-ink-900/40 p-6">
          <div className="flex items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold-400/10 text-gold-300">
                <Settings className="h-6 w-6" />
              </div>

              <div>
                <h2 className="font-display text-xl text-cream">
                  Inscriptions
                </h2>

                <p className="mt-2 text-sm text-cream-dim">
                  Contrôlez l'ouverture des réservations
                  publiques.
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={
                settings.registrationsOpen
              }
              onClick={() =>
                updateField(
                  "registrationsOpen",
                  !settings.registrationsOpen,
                )
              }
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                settings.registrationsOpen
                  ? "bg-[#d4ae63]"
                  : "bg-white/20"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                  settings.registrationsOpen
                    ? "left-6"
                    : "left-1"
                }`}
              />
            </button>
          </div>

          <div
            className={`mt-5 rounded-2xl border p-4 ${
              settings.registrationsOpen
                ? "border-emerald-400/20 bg-emerald-400/5"
                : "border-red-400/20 bg-red-400/5"
            }`}
          >
            <div className="flex items-center gap-3">
              {settings.registrationsOpen ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              ) : (
                <XCircle className="h-5 w-5 text-red-300" />
              )}

              <div>
                <p className="text-sm font-medium text-cream">
                  {settings.registrationsOpen
                    ? "Inscriptions ouvertes"
                    : "Inscriptions fermées"}
                </p>

                <p className="mt-1 text-xs text-cream-dim">
                  {settings.registrationsOpen
                    ? "Les visiteurs peuvent actuellement réserver leur place."
                    : "Les nouvelles réservations sont actuellement bloquées."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* RÉCAPITULATIF */}
        <section className="rounded-3xl border border-gold-400/10 bg-ink-900/40 p-6">
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-cream-dim">
                Événement
              </p>

              <p className="mt-2 text-sm font-medium text-cream">
                {settings.eventName}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-cream-dim">
                Date
              </p>

              <p className="mt-2 text-sm font-medium text-cream">
                {formatDate(settings.eventDate)}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-cream-dim">
                Heure
              </p>

              <p className="mt-2 text-sm font-medium text-cream">
                {settings.eventTime}
              </p>
            </div>
          </div>
        </section>

        {/* BOUTON ENREGISTRER */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#d4ae63] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#e2bf78] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />

                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />

                Enregistrer les paramètres
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}