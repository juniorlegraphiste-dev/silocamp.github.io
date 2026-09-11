import {
  CalendarDays,
  Settings,
  Users,
} from "lucide-react";

export default function AdminSettings() {
  return (
    <div className="container-px mx-auto max-w-5xl pb-24 pt-10 lg:pt-12">
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
        <section className="rounded-3xl border border-gold-400/10 bg-ink-900/40 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-400/10 text-gold-300">
              <CalendarDays className="h-6 w-6" />
            </div>

            <div>
              <h2 className="font-display text-xl text-cream">
                Événement
              </h2>

              <p className="mt-2 text-sm text-cream-dim">
                Les paramètres de l'événement pourront être configurés ici.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-gold-400/10 bg-ink-900/40 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-400/10 text-gold-300">
              <Users className="h-6 w-6" />
            </div>

            <div>
              <h2 className="font-display text-xl text-cream">
                Capacité
              </h2>

              <p className="mt-2 text-sm text-cream-dim">
                La gestion de la capacité maximale pourra être configurée ici.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}