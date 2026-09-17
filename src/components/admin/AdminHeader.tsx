import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  Bell,
  CalendarDays,
  ChevronDown,
  ExternalLink,
  LogOut,
  Search,
  Settings,
  ShieldCheck,
  User,
  X,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

type AdminHeaderProps = {
  title?: string;
  subtitle?: string;
  onLogout: () => void;
};

type UserMenuProps = {
  onLogout: () => void;
  loggingOut: boolean;
};

export default function AdminHeader({
  title,
  subtitle,
  onLogout,
}: AdminHeaderProps) {
  const navigate = useNavigate();

  const [notificationOpen, setNotificationOpen] =
    useState(false);

  const [userMenuOpen, setUserMenuOpen] =
    useState(false);

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [searchValue, setSearchValue] =
    useState("");

  const [loggingOut, setLoggingOut] =
    useState(false);

  const notificationRef =
    useRef<HTMLDivElement | null>(null);

  const userMenuRef =
    useRef<HTMLDivElement | null>(null);

  const searchInputRef =
    useRef<HTMLInputElement | null>(null);

  /*
   * Date actuelle
   */
  const today = new Intl.DateTimeFormat(
    "fr-FR",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  ).format(new Date());

  /*
   * Fermer les menus lorsqu'on clique
   * en dehors de leur zone.
   */
  useEffect(() => {
    const handleOutsideClick = (
      event: MouseEvent,
    ) => {
      const target = event.target as Node;

      if (
        notificationRef.current &&
        !notificationRef.current.contains(target)
      ) {
        setNotificationOpen(false);
      }

      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(target)
      ) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, []);

  /*
   * Gestion de la touche Escape.
   */
  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key !== "Escape") {
        return;
      }

      setNotificationOpen(false);
      setUserMenuOpen(false);
      setSearchOpen(false);
    };

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, []);

  /*
   * Focus automatique sur la recherche.
   */
  useEffect(() => {
    if (!searchOpen) {
      return;
    }

    const timeout = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [searchOpen]);

  /*
   * Déconnexion administrateur.
   *
   * Le vrai traitement est effectué par AdminLayout.
   * Le Header se contente de transmettre l'action.
   */
  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      await onLogout();
    } finally {
      setLoggingOut(false);
      setUserMenuOpen(false);
    }
  };

  /*
   * Recherche rapide.
   */
  const handleSearchSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const value = searchValue.trim();

    if (!value) {
      return;
    }

    setSearchOpen(false);

    navigate(
      `/admin/tickets?search=${encodeURIComponent(value)}`,
    );
  };

  /*
   * Ouvre la recherche et ferme les autres menus.
   */
  const openSearch = () => {
    setNotificationOpen(false);
    setUserMenuOpen(false);
    setSearchOpen(true);
  };

  /*
   * Ouvre les notifications.
   */
  const toggleNotifications = () => {
    setNotificationOpen((current) => !current);
    setUserMenuOpen(false);
    setSearchOpen(false);
  };

  /*
   * Ouvre le menu utilisateur.
   */
  const toggleUserMenu = () => {
    setUserMenuOpen((current) => !current);
    setNotificationOpen(false);
    setSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#080807]/95 backdrop-blur-xl">

      <div className="flex min-h-[78px] items-center justify-between gap-4 px-5 md:px-8 lg:px-10">

        {/* =====================================================
            GAUCHE
        ====================================================== */}

        <div className="min-w-0">

          {title ? (
            <>
              <div className="flex items-center gap-2">

                <h1 className="truncate text-lg font-black tracking-tight text-[#F5F1E8] md:text-xl">
                  {title}
                </h1>

              </div>

              {subtitle && (
                <p className="mt-1 hidden truncate text-xs font-medium text-[#A8A297] sm:block">
                  {subtitle}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#C8A45D]">
                Administration
              </p>

              <p className="mt-1 text-sm font-semibold text-[#F5F1E8]">
                Gestion de l'événement
              </p>
            </>
          )}

        </div>

        {/* =====================================================
            DROITE
        ====================================================== */}

        <div className="flex shrink-0 items-center gap-2">

          {/* ===================================================
              DATE
          ==================================================== */}

          <div className="hidden items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5 xl:flex">

            <CalendarDays className="h-4 w-4 text-[#C8A45D]" />

            <span className="text-xs font-semibold capitalize text-[#A8A297]">
              {today}
            </span>

          </div>

          {/* ===================================================
              RECHERCHE
          ==================================================== */}

          <div className="relative">

            {searchOpen ? (
              <form
                onSubmit={handleSearchSubmit}
                className="absolute right-0 top-0 z-50 flex w-[280px] items-center gap-2 rounded-xl border border-[#C8A45D]/30 bg-[#11100E] p-2 shadow-2xl shadow-black/40 sm:w-[320px]"
              >

                <Search className="ml-2 h-4 w-4 shrink-0 text-[#C8A45D]" />

                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchValue}
                  onChange={(event) =>
                    setSearchValue(event.target.value)
                  }
                  placeholder="Rechercher un participant..."
                  className="h-9 min-w-0 flex-1 bg-transparent px-1 text-sm font-medium text-[#F5F1E8] outline-none placeholder:text-[#68635B]"
                />

                <button
                  type="button"
                  onClick={() => {
                    setSearchValue("");
                    setSearchOpen(false);
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#8E897F] transition hover:bg-white/5 hover:text-white"
                  aria-label="Fermer la recherche"
                >
                  <X className="h-4 w-4" />
                </button>

              </form>
            ) : (
              <button
                type="button"
                onClick={openSearch}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-[#A8A297] transition hover:border-[#C8A45D]/30 hover:bg-[#C8A45D]/5 hover:text-[#C8A45D]"
                aria-label="Rechercher"
              >
                <Search className="h-[18px] w-[18px]" />
              </button>
            )}

          </div>

          {/* ===================================================
              NOTIFICATIONS
          ==================================================== */}

          <div
            ref={notificationRef}
            className="relative"
          >

            <button
              type="button"
              onClick={toggleNotifications}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-[#A8A297] transition hover:border-[#C8A45D]/30 hover:bg-[#C8A45D]/5 hover:text-[#C8A45D]"
              aria-label="Notifications"
              aria-expanded={notificationOpen}
            >

              <Bell className="h-[18px] w-[18px]" />

              {/* Badge */}
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#C8A45D] ring-2 ring-[#080807]" />

            </button>

            {notificationOpen && (
              <NotificationPanel
                onClose={() =>
                  setNotificationOpen(false)
                }
              />
            )}

          </div>

          {/* ===================================================
              SEPARATEUR
          ==================================================== */}

          <div className="mx-1 hidden h-8 w-px bg-white/[0.08] sm:block" />

          {/* ===================================================
              PROFIL
          ==================================================== */}

          <div
            ref={userMenuRef}
            className="relative"
          >

            <button
              type="button"
              onClick={toggleUserMenu}
              className="group flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] p-1.5 pr-2.5 transition hover:border-[#C8A45D]/30 hover:bg-[#C8A45D]/5"
              aria-label="Menu administrateur"
              aria-expanded={userMenuOpen}
            >

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#C8A45D] to-[#8F6E2D] text-[#0B0A08] shadow-lg shadow-[#C8A45D]/10">

                <User className="h-4 w-4 stroke-[2.5]" />

              </div>

              <div className="hidden min-w-0 text-left sm:block">

                <p className="truncate text-xs font-black text-[#F5F1E8]">
                  Administrateur
                </p>

                <p className="text-[10px] font-medium text-[#8E897F]">
                  SiloCamp
                </p>

              </div>

              <ChevronDown
                className={`hidden h-4 w-4 text-[#8E897F] transition sm:block ${
                  userMenuOpen
                    ? "rotate-180"
                    : ""
                }`}
              />

            </button>

            {userMenuOpen && (
              <UserMenu
                onLogout={handleLogout}
                loggingOut={loggingOut}
              />
            )}

          </div>

        </div>

      </div>

    </header>
  );
}


/* ============================================================
   NOTIFICATION PANEL
============================================================ */

function NotificationPanel({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <div className="absolute right-0 top-[52px] z-50 w-[320px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11100E] shadow-2xl shadow-black/50">

      <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-4">

        <div>
          <h3 className="text-sm font-black text-[#F5F1E8]">
            Notifications
          </h3>

          <p className="mt-0.5 text-[11px] font-medium text-[#777269]">
            Informations SiloCamp
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#777269] transition hover:bg-white/5 hover:text-white"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>

      </div>

      <div className="p-2">

        <NotificationItem
          icon={
            <ShieldCheck className="h-4 w-4" />
          }
          title="Système opérationnel"
          description="La plateforme SiloCamp fonctionne normalement."
          time="Maintenant"
          active
        />

        <NotificationItem
          icon={
            <CalendarDays className="h-4 w-4" />
          }
          title="Camp International Silo 2026"
          description="Les inscriptions sont actuellement ouvertes."
          time="Aujourd'hui"
        />

      </div>

      <div className="border-t border-white/[0.07] p-3">

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl px-3 py-2 text-xs font-bold text-[#C8A45D] transition hover:bg-[#C8A45D]/5"
        >
          Fermer
        </button>

      </div>

    </div>
  );
}


/* ============================================================
   NOTIFICATION ITEM
============================================================ */

function NotificationItem({
  icon,
  title,
  description,
  time,
  active = false,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  time: string;
  active?: boolean;
}) {
  return (
    <div className="flex gap-3 rounded-xl p-3 transition hover:bg-white/[0.025]">

      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          active
            ? "bg-emerald-500/10 text-emerald-400"
            : "bg-[#C8A45D]/10 text-[#C8A45D]"
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">

        <div className="flex items-start justify-between gap-2">

          <p className="text-xs font-black text-[#E9E3D8]">
            {title}
          </p>

          {active && (
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C8A45D]" />
          )}

        </div>

        <p className="mt-1 text-[11px] leading-5 text-[#777269]">
          {description}
        </p>

        <p className="mt-1.5 text-[10px] font-semibold text-[#555149]">
          {time}
        </p>

      </div>

    </div>
  );
}


/* ============================================================
   USER MENU
============================================================ */

function UserMenu({
  onLogout,
  loggingOut,
}: UserMenuProps) {
  return (
    <div className="absolute right-0 top-[52px] z-50 w-[250px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11100E] shadow-2xl shadow-black/50">

      {/* PROFILE */}

      <div className="border-b border-white/[0.07] p-4">

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#C8A45D] to-[#8F6E2D] text-[#0B0A08]">

            <User className="h-5 w-5 stroke-[2.5]" />

          </div>

          <div className="min-w-0">

            <p className="truncate text-sm font-black text-[#F5F1E8]">
              Administrateur
            </p>

            <p className="mt-0.5 truncate text-[11px] font-medium text-[#777269]">
              Gestionnaire SiloCamp
            </p>

          </div>

        </div>

      </div>

      {/* MENU */}

      <div className="p-2">

        <Link
          to="/admin/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-[#B8B1A6] transition hover:bg-white/[0.04] hover:text-[#F5F1E8]"
        >
          <Settings className="h-4 w-4 text-[#8E897F]" />
          <span>Paramètres</span>
        </Link>

        <Link
          to="/"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-[#B8B1A6] transition hover:bg-white/[0.04] hover:text-[#F5F1E8]"
        >
          <ExternalLink className="h-4 w-4 text-[#8E897F]" />
          <span>Retour au site</span>
        </Link>

      </div>

      {/* LOGOUT */}

      <div className="border-t border-white/[0.07] p-2">

        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-red-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
        >

          <LogOut className="h-4 w-4" />

          <span>
            {loggingOut
              ? "Déconnexion..."
              : "Se déconnecter"}
          </span>

        </button>

      </div>

    </div>
  );
}