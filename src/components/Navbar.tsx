import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { cn } from "@/utils/cn";
import { ArrowRight, Ticket } from "lucide-react";

type NavEntry =
  | { label: string; kind: "route"; to: string }
  | { label: string; kind: "section"; id: string };

const NAV: NavEntry[] = [
  { label: "Accueil", kind: "section", id: "accueil" },
  { label: "Événements", kind: "section", id: "programme" },
  { label: "L'expérience", kind: "section", id: "experience" },
  { label: "FAQ", kind: "section", id: "faq" },
  { label: "Contact", kind: "route", to: "/contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const { count } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
    };

    onScroll();

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function goToSection(id: string) {
    setOpen(false);

    if (location.pathname === "/") {
      setTimeout(() => {
        const element = document.getElementById(id);

        if (!element) {
          console.warn(`Section #${id} introuvable`);
          return;
        }

        const navbarHeight = 80;

        const top =
          element.getBoundingClientRect().top +
          window.scrollY -
          navbarHeight;

        window.scrollTo({
          top,
          behavior: "smooth",
        });
      }, 50);

      return;
    }

    sessionStorage.setItem("silo-scroll-to", id);
    navigate("/");
  }

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled || open
          ? "border-b border-gold-400/10 bg-ink-950/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <nav className="container-px mx-auto flex h-20 max-w-7xl items-center justify-between">
        <Link
          to="/"
          className="group flex items-center gap-3"
          aria-label="Camp International Silo — Accueil"
        >
          <span className="font-display text-4xl font-bold tracking-wide text-cream">
            SILO<span className="text-gold-gradient"> CAMP</span>
          </span>
        </Link>

        <div className="hidden items-center gap-9 lg:flex">
          {NAV.map((entry) =>
            entry.kind === "route" ? (
              <Link
                key={entry.label}
                to={entry.to}
                className="group relative text-sm tracking-wide text-cream-dim transition-colors hover:text-cream"
              >
                {entry.label}

                <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-gold-300 transition-all duration-300 group-hover:w-full" />
              </Link>
            ) : (
              <button
                key={entry.label}
                type="button"
                onClick={() => goToSection(entry.id)}
                className="group relative text-sm tracking-wide text-cream-dim transition-colors hover:text-cream"
              >
                {entry.label}

                <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-gold-300 transition-all duration-300 group-hover:w-full" />
              </button>
            ),
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* <Link
            to="/ticket/verify"
            className="hidden items-center gap-2 rounded-full border border-gold-400/40 px-4 py-2 text-sm text-cream transition-colors hover:bg-gold-400/10 md:flex"
            aria-label="Scanner un QR Code"
          >
            <QrCode className="h-4 w-4" />
            <span>Scanner QR Code</span>
          </Link> */}

          <Link
            to="/billetterie"
            className="relative hidden items-center gap-2 rounded-full border border-gold-400/40 px-4 py-2 text-sm text-cream transition-colors hover:bg-gold-400/10 sm:flex"
            aria-label="Voir le panier"
          >
            <Ticket className="h-4 w-4" />

            <span>Panier</span>

            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-gold-400 px-2 text-xs font-semibold text-ink-950">
              {count}
            </span>
          </Link>

          <Link
            to="/billetterie"
            className="group btn-gold hidden items-center gap-2 text-sm md:inline-flex"
          >
            Réserver

            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gold-400/25 text-cream lg:hidden"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
          >
            <div className="relative h-4 w-5">
              <span
                className={cn(
                  "absolute left-0 h-0.5 w-5 bg-current transition-all duration-300",
                  open ? "top-1.5 rotate-45" : "top-0",
                )}
              />

              <span
                className={cn(
                  "absolute left-0 top-1.5 h-0.5 w-5 bg-current transition-all duration-300",
                  open && "opacity-0",
                )}
              />

              <span
                className={cn(
                  "absolute left-0 h-0.5 w-5 bg-current transition-all duration-300",
                  open ? "top-1.5 -rotate-45" : "top-3",
                )}
              />
            </div>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity: 0,
              height: 0,
            }}
            animate={{
              opacity: 1,
              height: "auto",
            }}
            exit={{
              opacity: 0,
              height: 0,
            }}
            transition={{
              duration: 0.4,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="overflow-hidden border-t border-gold-400/10 bg-ink-950/95 backdrop-blur-xl lg:hidden"
          >
            <div className="container-px mx-auto flex max-w-7xl flex-col gap-1 py-6">
              {NAV.map((entry) =>
                entry.kind === "route" ? (
                  <Link
                    key={entry.label}
                    to={entry.to}
                    className="rounded-xl px-4 py-3 font-display text-2xl text-cream hover:bg-gold-400/10"
                  >
                    {entry.label}
                  </Link>
                ) : (
                  <button
                    key={entry.label}
                    type="button"
                    onClick={() => goToSection(entry.id)}
                    className="rounded-xl px-4 py-3 text-left font-display text-2xl text-cream hover:bg-gold-400/10"
                  >
                    {entry.label}
                  </button>
                ),
              )}

              <div className="mt-4 flex flex-col gap-3">
                {/* <Link
                  to="/ticket/verify"
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-gold-400/40 px-5 py-3 text-sm font-medium text-cream transition-colors hover:bg-gold-400/10"
                >
                  <QrCode className="h-5 w-5 text-gold-300" />
                  Scanner QR Code
                </Link> */}

                <Link
                  to="/billetterie"
                  className="btn-gold w-full"
                >
                  Réserver mon billet
                </Link>

                <Link
                  to="/billetterie"
                  className="text-center text-sm text-cream-dim"
                >
                  {count > 0
                    ? `${count} billet(s) dans le panier`
                    : "Panier vide"}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}