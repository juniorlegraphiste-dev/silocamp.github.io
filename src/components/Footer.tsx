/**
 * Footer — pied de page global.
 * Marque, navigation, événements, aide, inscription et mentions
 * légales. Un rappel CTA conclut la page.
 */
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export function Footer() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Défile vers une section (gère le cas hors accueil)
  function goSection(id: string) {
    if (location.pathname !== "/") {
      navigate("/");
      window.setTimeout(
        () =>
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }),
        120,
      );
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <footer className="relative overflow-hidden border-t border-gold-400/10 bg-ink-900">
      {/* Bande CTA */}
      <div className="container-px mx-auto w-full max-w-7xl pt-10 sm:pt-14 lg:pt-16">
        <div
          className="
      rounded-[22px]
      border
      border-gold-400/20
      bg-ink-950/70
      px-6
      py-10
      sm:px-10
      sm:py-12
      lg:px-12
      lg:py-14
    "
        >
          <div
            className="
        flex
        min-w-0
        flex-col
        items-center
        gap-8
        text-center
      "
          >
            <div className="min-w-0">
              <h3
                className="
            text-xl
            font-medium
            leading-tight
            text-cream
            sm:text-2xl
            lg:text-3xl
          "
              >
                Prêt à vivre le Camp International Silo ?
              </h3>

              <p
                className="
            mx-auto
            mt-4
            max-w-2xl
            text-sm
            leading-6
            text-cream-dim
            sm:text-[15px]
          "
              >
                Rejoignez des participants venus de plusieurs pays pour vivre
                des moments de communion, d'enseignement, de prière et de
                louange. Réservez gratuitement votre place dès aujourd'hui.
              </p>
            </div>

            <Link
              to="/evenement/camp-international-silo-2026"
              className="
          btn-gold
          group
          inline-flex
          w-auto
          min-w-[260px]
          items-center
          justify-center
          gap-3
          px-8
          py-3.5
        "
            >
              <span>Réserver gratuitement</span>

              <ArrowRight
                className="
            h-5
            w-5
            shrink-0
            transition-transform
            duration-300
            group-hover:translate-x-1
          "
              />
            </Link>
          </div>
        </div>
      </div>

      {/* Colonnes */}
      <div
        className="
    container-px
    mx-auto
    grid
    w-full
    max-w-7xl
    grid-cols-1
    gap-10
    py-12
    sm:gap-12
    sm:py-14
    md:grid-cols-2
    lg:grid-cols-4
    lg:gap-10
    lg:py-16
  "
      >
        {/* =======================================================
      BRAND
  ======================================================= */}

        <div className="min-w-0 lg:col-span-1">
          <div className="font-display text-2xl font-semibold text-cream sm:text-3xl">
            SILO<span className="text-gold-gradient"> CAMP</span>
          </div>

          <p
            className="
        mt-4
        max-w-sm
        text-sm
        leading-relaxed
        text-cream-dim
      "
          >
            Le Camp International Silo rassemble des participants venus de
            plusieurs pays pour vivre des temps de communion, de prière, de
            louange, d'enseignement et de transformation spirituelle.
          </p>

          {/* Réseaux sociaux */}

          <div className="mt-6 flex flex-wrap gap-3">
            <Social label="Instagram">
              <path d="M12 2.2c3.2 0 3.6 0 4.8.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.2.07 1.6.07 4.8s0 3.6-.07 4.8c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.2.06-1.6.07-4.8.07s-3.6 0-4.8-.07c-1.17-.05-1.8-.25-2.23-.41a3.8 3.8 0 0 1-1.38-.9 3.8 3.8 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.21 15.6 2.2 15.2 2.2 12s0-3.6.07-4.8c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.4 2.21 8.8 2.2 12 2.2Z" />

              <circle cx="12" cy="12" r="3.2" />

              <circle
                cx="17.2"
                cy="6.8"
                r="1"
                fill="currentColor"
                stroke="none"
              />
            </Social>

            <Social label="YouTube">
              <path d="M21.6 8.2a2.5 2.5 0 0 0-1.76-1.77C18.27 6 12 6 12 6s-6.27 0-7.84.43A2.5 2.5 0 0 0 2.4 8.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 3.8 2.5 2.5 0 0 0 1.76 1.77C5.73 18 12 18 12 18s6.27 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-3.8Z" />

              <path d="m10 9 5 3-5 3V9Z" fill="currentColor" stroke="none" />
            </Social>

            <Social label="WhatsApp">
              <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.26A10 10 0 1 0 12 2Z" />

              <path
                d="M8.6 7.8c.2-.5.4-.5.6-.5h.5c.2 0 .4 0 .6.5l.7 1.7c.1.2 0 .4 0 .5l-.4.5c-.1.1-.2.3 0 .5.2.4.7 1.2 1.5 1.9 1 .9 1.8 1.1 2 1.2.2 0 .4 0 .5-.1l.5-.6c.2-.2.4-.2.5-.1l1.7.8c.2.1.4.2.4.3 0 .2 0 .9-.3 1.3-.3.4-1.2.9-1.7.9-.5 0-1.5.2-3.7-.8-2.6-1.2-4.2-3.8-4.3-4-.1-.2-1-1.4-1-2.6 0-1.3.6-1.9.9-2.2Z"
                fill="currentColor"
                stroke="none"
              />
            </Social>
          </div>
        </div>

        {/* =======================================================
      NAVIGATION
  ======================================================= */}

        <div className="min-w-0">
          <FooterCol title="Navigation">
            <FooterLink to="/">Accueil</FooterLink>

            <FooterLink to="/billetterie">Billetterie</FooterLink>

            <FooterLink to="/evenement/camp-international-silo">
              Le Camp International Silo
            </FooterLink>

            <li>
              <button
                onClick={() => goSection("faq")}
                className="
            text-left
            text-sm
            leading-6
            text-cream-dim
            transition-colors
            hover:text-cream
          "
              >
                Foire aux questions
              </button>
            </li>
          </FooterCol>
        </div>

        {/* =======================================================
      ÉVÉNEMENTS
  ======================================================= */}

        <div className="min-w-0">
          <FooterCol title="Événements">
            <FooterLink to="/evenement/camp-international-silo">
              Camp International Silo 2026
            </FooterLink>
          </FooterCol>
        </div>

        {/* =======================================================
      NEWSLETTER
  ======================================================= */}

        <div className="min-w-0">
          <h4
            className="
        text-xs
        font-medium
        uppercase
        tracking-[0.2em]
        text-gold-300
      "
          >
            Restez connectés
          </h4>

          <p
            className="
        mt-4
        max-w-md
        text-sm
        leading-6
        text-cream-dim
      "
          >
            Recevez les dernières informations, les annonces importantes et les
            prochaines dates du Camp International Silo.
          </p>

          <form
            className="mt-5 w-full"
            onSubmit={(e) => {
              e.preventDefault();

              if (email.trim()) {
                setSent(true);
                setEmail("");
              }
            }}
          >
            <div
              className="
          flex
          w-full
          flex-col
          overflow-hidden
          rounded-2xl
          border
          border-gold-400/25
          bg-ink-950/60
          sm:flex-row
          sm:rounded-full
        "
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSent(false);
                }}
                placeholder="Votre e-mail"
                aria-label="Votre adresse e-mail"
                className="
            min-w-0
            w-full
            flex-1
            bg-transparent
            px-4
            py-3
            text-sm
            text-cream
            outline-none
            placeholder:text-cream-faint
            sm:py-2.5
          "
              />

              <button
                type="submit"
                className="
            w-full
            shrink-0
            bg-gold-400
            px-5
            py-3
            text-sm
            font-medium
            text-ink-950
            transition-colors
            hover:bg-gold-300
            sm:w-auto
            sm:py-2.5
          "
              >
                Je m'inscris
              </button>
            </div>

            {sent && (
              <p className="mt-2 text-xs text-gold-300">
                Merci ! Vous êtes bien inscrit·e.
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Bas de page */}
      <div className="border-t border-gold-400/10">
        <div
          className="
      container-px
      mx-auto
      flex
      w-full
      max-w-7xl
      flex-col
      items-center
      gap-3
      py-5
      text-center
      text-xs
      text-cream-faint
      sm:flex-row
      sm:justify-between
      sm:text-left
    "
        >
          <p>© 2026 SILO CAMP. Tous droits réservés.</p>

          <p className="hidden tracking-wide md:block">
            Prière · Louange · Enseignement · Communion
          </p>

          <p className="max-w-full">100 % Gratuit · E-billet avec QR Code</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-xs font-medium uppercase tracking-[0.2em] text-gold-300">
        {title}
      </h4>
      <ul className="mt-4 space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        to={to}
        className="text-sm text-cream-dim transition-colors hover:text-cream"
      >
        {children}
      </Link>
    </li>
  );
}

function Social({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-gold-400/20 text-cream-dim transition-all hover:border-gold-400/60 hover:text-gold-200"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        className="h-4 w-4"
      >
        {children}
      </svg>
    </a>
  );
}
