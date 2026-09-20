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
                title="Camp International Silo 2026"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3325.1555360435!2d-7.6407659176439475!3d33.549335004636525!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xda62d39d2ce1283%3A0x857adc4e928e93fe!2sLe%20Carr%C3%A9%20d'Or!5e0!3m2!1sfr!2sma!4v1789894028146!5m2!1sfr!2sma"
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
