import { useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  Save,
  Settings,
  Users,
} from "lucide-react";

type Settings = {
  id: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  capacity: number;
  registrationsOpen: boolean;
  updatedAt?: string;
};

type Stats = {
  capacity: number;
  totalTickets: number;
  validTickets: number;
  usedTickets: number;
  cancelledTickets: number;
  reserved: number;
  used: number;
  remaining: number;
  registrationsOpen: boolean;
};

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [registrationsOpen, setRegistrationsOpen] = useState(true);

  /**
   * Charge les paramètres et les statistiques.
   */
  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [settingsResponse, statsResponse] = await Promise.all([
        fetch("/api/settings", {
          method: "GET",
          credentials: "include",
        }),
        fetch("/api/tickets/stats", {
          method: "GET",
          credentials: "include",
        }),
      ]);

      const settingsData = await settingsResponse.json().catch(() => null);
      const statsData = await statsResponse.json().catch(() => null);

      if (!settingsResponse.ok || !settingsData?.ok) {
        throw new Error(
          settingsData?.error ||
            "Impossible de charger les paramètres de SiloCamp.",
        );
      }

      const loadedSettings = settingsData.settings as Settings;

      setSettings(loadedSettings);

      setEventName(loadedSettings.eventName ?? "");
      setEventDate(loadedSettings.eventDate ?? "");
      setEventTime(loadedSettings.eventTime ?? "");
      setEventLocation(loadedSettings.eventLocation ?? "");
      setCapacity(String(loadedSettings.capacity ?? 1200));
      setRegistrationsOpen(Boolean(loadedSettings.registrationsOpen));

      if (statsResponse.ok && statsData?.ok) {
        setStats(statsData);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors du chargement.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  /**
   * Sauvegarde les paramètres.
   */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSuccess("");
    setError("");

    const normalizedName = eventName.trim();
    const normalizedLocation = eventLocation.trim();
    const normalizedCapacity = Number(capacity);

    if (!normalizedName) {
      setError("Le nom de l'événement est obligatoire.");
      return;
    }

    if (!eventDate) {
      setError("La date de l'événement est obligatoire.");
      return;
    }

    if (!eventTime) {
      setError("L'heure de l'événement est obligatoire.");
      return;
    }

    if (
      !Number.isInteger(normalizedCapacity) ||
      normalizedCapacity < 1
    ) {
      setError("La capacité doit être un nombre entier supérieur à 0.");
      return;
    }

    if (stats && normalizedCapacity < stats.reserved) {
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
        },
        body: JSON.stringify({
          eventName: normalizedName,
          eventDate,
          eventTime,
          eventLocation: normalizedLocation,
          capacity: normalizedCapacity,
          registrationsOpen,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.error ||
            "Impossible d'enregistrer les paramètres.",
        );
      }

      const updatedSettings = data.settings as Settings;

      setSettings(updatedSettings);

      setEventName(updatedSettings.eventName ?? "");
      setEventDate(updatedSettings.eventDate ?? "");
      setEventTime(updatedSettings.eventTime ?? "");
      setEventLocation(updatedSettings.eventLocation ?? "");
      setCapacity(String(updatedSettings.capacity ?? 1200));
      setRegistrationsOpen(
        Boolean(updatedSettings.registrationsOpen),
      );

      setSuccess("Les paramètres ont été enregistrés avec succès.");

      // Actualisation des statistiques après sauvegarde.
      try {
        const statsResponse = await fetch("/api/tickets/stats", {
          method: "GET",
          credentials: "include",
        });

        const statsData = await statsResponse.json().catch(() => null);

        if (statsResponse.ok && statsData?.ok) {
          setStats(statsData);
        }
      } catch {
        // Les statistiques ne doivent pas faire échouer la sauvegarde.
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'enregistrer les paramètres.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="container-px mx-auto max-w-5xl pb-24 pt-10 lg:pt-12">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-cream-dim">
            <Loader2 className="h-8 w-8 animate-spin text-gold-300" />

            <p className="text-sm">
              Chargement des paramètres...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-px mx-auto max-w-5xl pb-24 pt-10 lg:pt-12">
      {/* En-tête */}
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

      {/* Messages */}
      <div className="mb-6 space-y-3">
        {success && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-4 text-sm text-emerald-200">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

            <p>{success}</p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-4 text-sm text-red-200">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Événement */}
        <section className="rounded-3xl border border-gold-400/10 bg-ink-900/40 p-6 lg:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold-400/10 text-gold-300">
              <CalendarDays className="h-6 w-6" />
            </div>

            <div>
              <h2 className="font-display text-xl text-cream">
                Événement
              </h2>

              <p className="mt-2 text-sm text-cream-dim">
                Configurez les informations principales du Camp
                International Silo 2026.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6">
            {/* Nom */}
            <div>
              <label
                htmlFor="eventName"
                className="mb-2 block text-sm font-medium text-cream"
              >
                Nom de l'événement
              </label>

              <input
                id="eventName"
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Camp International Silo 2026"
                className="w-full rounded-2xl border border-gold-400/10 bg-ink-950 px-4 py-3 text-sm text-cream outline-none transition placeholder:text-cream-dim/50 focus:border-gold-400/40 focus:ring-2 focus:ring-gold-400/10"
              />
            </div>

            {/* Date + heure */}
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="eventDate"
                  className="mb-2 block text-sm font-medium text-cream"
                >
                  Date
                </label>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gold-300" />

                  <input
                    id="eventDate"
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full rounded-2xl border border-gold-400/10 bg-ink-950 py-3 pl-12 pr-4 text-sm text-cream outline-none transition focus:border-gold-400/40 focus:ring-2 focus:ring-gold-400/10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="eventTime"
                  className="mb-2 block text-sm font-medium text-cream"
                >
                  Heure
                </label>

                <div className="relative">
                  <Clock3 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gold-300" />

                  <input
                    id="eventTime"
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full rounded-2xl border border-gold-400/10 bg-ink-950 py-3 pl-12 pr-4 text-sm text-cream outline-none transition focus:border-gold-400/40 focus:ring-2 focus:ring-gold-400/10"
                  />
                </div>
              </div>
            </div>

            {/* Lieu */}
            <div>
              <label
                htmlFor="eventLocation"
                className="mb-2 block text-sm font-medium text-cream"
              >
                Lieu
              </label>

              <div className="relative">
                <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gold-300" />

                <input
                  id="eventLocation"
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="Lieu du Camp International Silo"
                  className="w-full rounded-2xl border border-gold-400/10 bg-ink-950 py-3 pl-12 pr-4 text-sm text-cream outline-none transition placeholder:text-cream-dim/50 focus:border-gold-400/40 focus:ring-2 focus:ring-gold-400/10"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Capacité */}
        <section className="rounded-3xl border border-gold-400/10 bg-ink-900/40 p-6 lg:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold-400/10 text-gold-300">
              <Users className="h-6 w-6" />
            </div>

            <div>
              <h2 className="font-display text-xl text-cream">
                Capacité
              </h2>

              <p className="mt-2 text-sm text-cream-dim">
                Définissez le nombre maximum de places disponibles.
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

            <input
              id="capacity"
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full rounded-2xl border border-gold-400/10 bg-ink-950 px-4 py-3 text-sm text-cream outline-none transition focus:border-gold-400/40 focus:ring-2 focus:ring-gold-400/10"
            />

            {stats && (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-gold-400/10 bg-ink-950/60 p-4">
                  <p className="text-xs uppercase tracking-wider text-cream-dim">
                    Réservées
                  </p>

                  <p className="mt-1 text-2xl font-semibold text-cream">
                    {stats.reserved}
                  </p>
                </div>

                <div className="rounded-2xl border border-gold-400/10 bg-ink-950/60 p-4">
                  <p className="text-xs uppercase tracking-wider text-cream-dim">
                    Restantes
                  </p>

                  <p className="mt-1 text-2xl font-semibold text-gold-300">
                    {stats.remaining}
                  </p>
                </div>

                <div className="rounded-2xl border border-gold-400/10 bg-ink-950/60 p-4">
                  <p className="text-xs uppercase tracking-wider text-cream-dim">
                    Capacité
                  </p>

                  <p className="mt-1 text-2xl font-semibold text-cream">
                    {stats.capacity}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Inscriptions */}
        <section className="rounded-3xl border border-gold-400/10 bg-ink-900/40 p-6 lg:p-8">
          <div className="flex items-center justify-between gap-6">
            <div>
              <h2 className="font-display text-xl text-cream">
                Inscriptions
              </h2>

              <p className="mt-2 max-w-xl text-sm text-cream-dim">
                Activez ou désactivez les nouvelles réservations
                pour l'événement.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setRegistrationsOpen((current) => !current)
              }
              aria-pressed={registrationsOpen}
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                registrationsOpen
                  ? "bg-gold-400"
                  : "bg-white/10"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                  registrationsOpen
                    ? "left-6"
                    : "left-1"
                }`}
              />
            </button>
          </div>

          <div
            className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
              registrationsOpen
                ? "border-emerald-400/20 bg-emerald-400/5 text-emerald-200"
                : "border-red-400/20 bg-red-400/5 text-red-200"
            }`}
          >
            {registrationsOpen
              ? "Les inscriptions sont actuellement ouvertes."
              : "Les inscriptions sont actuellement fermées."}
          </div>
        </section>

        {/* Bouton sauvegarde */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gold-400 px-6 py-3 text-sm font-semibold text-ink-950 transition hover:bg-gold-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Enregistrer les paramètres
              </>
            )}
          </button>
        </div>
      </form>

      {/* Information technique */}
      {settings?.updatedAt && (
        <p className="mt-8 text-right text-xs text-cream-dim/50">
          Dernière modification :{" "}
          {new Date(settings.updatedAt).toLocaleString("fr-FR")}
        </p>
      )}
    </div>
  );
}