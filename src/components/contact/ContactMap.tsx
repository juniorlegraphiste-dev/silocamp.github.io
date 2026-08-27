import { Reveal } from "@/components/Reveal";

export function ContactMap() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="mb-12 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-300">
              Localisation
            </span>

            <h2 className="mt-4 font-display text-4xl text-cream">
              Retrouvez-nous
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-cream-dim">
              Consultez l'emplacement du Camp International Silo et préparez
              facilement votre itinéraire.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-8 lg:grid-cols-1">
          {/* Carte Google */}
          <Reveal delay={0.1}>
            <div className="overflow-hidden rounded-3xl border border-gold-400/10 bg-ink-900/40 shadow-xl">
              <iframe
                title="Camp International Silo"
                src="https://www.google.com/maps?q=Casablanca,+Maroc&output=embed"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[520px] w-full border-0"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}