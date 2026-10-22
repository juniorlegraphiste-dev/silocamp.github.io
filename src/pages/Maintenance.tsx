
import { useState } from "react";
import {
  Sparkles,
  Clock3,
  Heart,
  Mail,
  RefreshCw,
} from "lucide-react";

export default function Maintenance() {
  const [refreshing, setRefreshing] = useState(false);

  const checkSite = () => {
    setRefreshing(true);
    window.location.reload();
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080808] px-5 py-12 text-white">
      {/* Lumières d'arrière-plan */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#d4af62]/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#d4af62]/10 blur-[120px]" />

      <div className="relative z-10 mx-auto w-full max-w-3xl text-center">
        {/* Identité SiloCamp */}
        <div className="mb-12 flex flex-col items-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d4af62]/40 bg-[#d4af62]/10">
            <Sparkles className="h-8 w-8 text-[#e8c982]" />
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.45em] text-[#e8c982]">
            Camp International Silo
          </p>

          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-wide sm:text-5xl">
            Silo<span className="text-[#e8c982]">Camp</span>
          </h1>

          <div className="mt-5 h-px w-20 bg-gradient-to-r from-transparent via-[#d4af62] to-transparent" />
        </div>

        {/* Message principal */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-10 shadow-2xl backdrop-blur-sm sm:px-12 sm:py-14">
          <div className="mx-auto mb-7 flex h-14 w-14 items-center justify-center rounded-full border border-[#d4af62]/30 bg-[#d4af62]/10">
            <Clock3 className="h-6 w-6 text-[#e8c982]" />
          </div>

          <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#e8c982]">
            Nous préparons la suite
          </p>

          <h2 className="mt-5 font-serif text-3xl font-medium leading-tight sm:text-5xl">
            Un instant de patience,
            <span className="mt-2 block text-[#e8c982]">
              nous revenons bientôt.
            </span>
          </h2>

          <p className="mx-auto mt-7 max-w-xl text-sm leading-7 text-white/65 sm:text-base">
            Notre plateforme est momentanément en maintenance afin
            d'améliorer votre expérience et de mieux vous accueillir.
            Nous mettons tout en œuvre pour revenir très prochainement.
          </p>

          <div className="mx-auto my-9 flex max-w-sm items-center justify-center gap-3 text-sm text-white/70">
            <Heart className="h-4 w-4 text-[#e8c982]" />
            <span>Merci pour votre patience et votre compréhension.</span>
          </div>

          <div className="mx-auto mb-8 max-w-md rounded-2xl border border-[#d4af62]/15 bg-black/30 p-5">
            <p className="font-serif text-lg italic leading-relaxed text-[#e8c982]">
              « Voici, je fais toutes choses nouvelles. »
            </p>
            <p className="mt-2 text-xs uppercase tracking-widest text-white/40">
              Apocalypse 21:5
            </p>
          </div>

          <button
            type="button"
            onClick={checkSite}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-3 rounded-full bg-[#d4af62] px-7 py-3.5 text-sm font-semibold text-[#111111] transition hover:bg-[#e8c982] disabled:opacity-70"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Vérifier si le site est disponible
          </button>
        </div>

        {/* Contact et pied de page */}
        <div className="mt-9">
          <p className="text-sm text-white/45">
            Une question concernant votre participation ?
          </p>

          <a
            href="mailto:contact@silocamp.org"
            className="mt-3 inline-flex items-center gap-2 text-sm text-[#e8c982] transition hover:text-white"
          >
            <Mail className="h-4 w-4" />
            Nous contacter
          </a>

          <p className="mt-10 text-[10px] uppercase tracking-[0.3em] text-white/25">
            SiloCamp · Gospel · Adoration · Communion
          </p>
        </div>
      </div>
    </main>
  );
}
