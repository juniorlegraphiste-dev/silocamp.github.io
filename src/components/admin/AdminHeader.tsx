import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  User,
  X,
} from "lucide-react";

interface AdminHeaderProps {
  onMenuClick?: () => void;
  sidebarOpen?: boolean;
  username?: string;
  notificationCount?: number;
}

export default function AdminHeader({
  onMenuClick,
  sidebarOpen = false,
  username = "Administrateur",
  notificationCount = 0,
}: AdminHeaderProps) {
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [notificationOpen, setNotificationOpen] =
    useState(false);

  const profileRef =
    useRef<HTMLDivElement | null>(null);

  const notificationRef =
    useRef<HTMLDivElement | null>(null);

  /**
   * Fermer les menus lorsqu'on clique
   * en dehors.
   */
  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent,
    ) {
      const target = event.target as Node;

      if (
        profileRef.current &&
        !profileRef.current.contains(target)
      ) {
        setProfileOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(target)
      ) {
        setNotificationOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, []);

  /**
   * Déconnexion.
   *
   * On utilise l'endpoint existant.
   * Même si le serveur rencontre une erreur,
   * on retourne vers l'accueil.
   */
  async function handleLogout() {
    setProfileOpen(false);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });
    } catch (error) {
      console.error(
        "[SiloCamp Admin Logout]",
        error,
      );
    } finally {
      navigate("/");
    }
  }

  function handleNotificationClick() {
    setNotificationOpen(
      !notificationOpen,
    );

    setProfileOpen(false);
  }

  function handleProfileClick() {
    setProfileOpen(!profileOpen);
    setNotificationOpen(false);
  }

  return (
    <header
      className="
        sticky
        top-0
        z-40
        h-[76px]
        border-b
        border-[#2a251b]
        bg-[#090908]/95
        backdrop-blur-xl
      "
    >
      <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* =====================================================
            LEFT
        ====================================================== */}

        <div className="flex min-w-0 items-center gap-3">

          {/* Mobile menu */}
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              aria-label={
                sidebarOpen
                  ? "Fermer le menu"
                  : "Ouvrir le menu"
              }
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                border
                border-[#302a1d]
                bg-[#12110e]
                text-[#e8d7ad]
                transition
                hover:border-[#806a32]
                hover:bg-[#1a1813]
                lg:hidden
              "
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          )}

          {/* Logo / title */}
          <div className="flex min-w-0 items-center gap-3">

            <div
              className="
                hidden
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                border
                border-[#4a3c20]
                bg-[#17140e]
                sm:flex
              "
            >
              <ShieldCheck
                className="
                  h-5
                  w-5
                  text-[#d8b968]
                "
              />
            </div>

            <div className="min-w-0">

              <p
                className="
                  truncate
                  text-sm
                  font-black
                  tracking-tight
                  text-[#f5f0e5]
                  sm:text-base
                "
              >
                Administration
              </p>

              <p
                className="
                  hidden
                  text-[11px]
                  font-medium
                  tracking-wide
                  text-[#8c8068]
                  sm:block
                "
              >
                Gestion du Camp International Silo
              </p>

            </div>
          </div>
        </div>

        {/* =====================================================
            RIGHT
        ====================================================== */}

        <div className="flex items-center gap-2 sm:gap-3">

          {/* -------------------------------------------------
              STATUS
          -------------------------------------------------- */}

          <div
            className="
              hidden
              items-center
              gap-2
              rounded-full
              border
              border-emerald-900/60
              bg-emerald-950/30
              px-3
              py-2
              md:flex
            "
          >
            <span className="relative flex h-2 w-2">

              <span
                className="
                  absolute
                  inline-flex
                  h-full
                  w-full
                  animate-ping
                  rounded-full
                  bg-emerald-400
                  opacity-60
                "
              />

              <span
                className="
                  relative
                  inline-flex
                  h-2
                  w-2
                  rounded-full
                  bg-emerald-400
                "
              />
            </span>

            <span
              className="
                text-[11px]
                font-bold
                text-emerald-300
              "
            >
              Système opérationnel
            </span>
          </div>

          {/* -------------------------------------------------
              NOTIFICATIONS
          -------------------------------------------------- */}

          <div
            ref={notificationRef}
            className="relative"
          >
            <button
              type="button"
              onClick={
                handleNotificationClick
              }
              aria-label="Notifications"
              className="
                relative
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                border
                border-[#2e291f]
                bg-[#11100e]
                text-[#b8ad97]
                transition
                hover:border-[#6b572b]
                hover:bg-[#191711]
                hover:text-[#e8d7ad]
              "
            >
              <Bell className="h-[18px] w-[18px]" />

              {notificationCount > 0 && (
                <span
                  className="
                    absolute
                    right-1
                    top-1
                    flex
                    h-4
                    min-w-4
                    items-center
                    justify-center
                    rounded-full
                    bg-[#c9a85b]
                    px-1
                    text-[9px]
                    font-black
                    text-[#0a0907]
                  "
                >
                  {notificationCount > 9
                    ? "9+"
                    : notificationCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div
                className="
                  absolute
                  right-0
                  top-[52px]
                  w-[320px]
                  overflow-hidden
                  rounded-2xl
                  border
                  border-[#30291d]
                  bg-[#11100e]
                  shadow-2xl
                  shadow-black/50
                "
              >
                <div
                  className="
                    flex
                    items-center
                    justify-between
                    border-b
                    border-[#29241b]
                    px-4
                    py-4
                  "
                >
                  <div>
                    <p
                      className="
                        text-sm
                        font-black
                        text-[#f4eee1]
                      "
                    >
                      Notifications
                    </p>

                    <p
                      className="
                        mt-0.5
                        text-[11px]
                        text-[#766e5e]
                      "
                    >
                      Activité récente
                    </p>
                  </div>

                  {notificationCount > 0 && (
                    <span
                      className="
                        rounded-full
                        bg-[#2a2111]
                        px-2
                        py-1
                        text-[10px]
                        font-black
                        text-[#d7b865]
                      "
                    >
                      {notificationCount} nouvelle
                      {notificationCount > 1
                        ? "s"
                        : ""}
                    </span>
                  )}
                </div>

                <div className="p-4">

                  {notificationCount > 0 ? (
                    <div
                      className="
                        rounded-xl
                        border
                        border-[#332b1e]
                        bg-[#17140f]
                        p-4
                      "
                    >
                      <div className="flex gap-3">

                        <div
                          className="
                            flex
                            h-9
                            w-9
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            bg-[#241d10]
                            text-[#d7b865]
                          "
                        >
                          <Bell className="h-4 w-4" />
                        </div>

                        <div>
                          <p
                            className="
                              text-xs
                              font-bold
                              text-[#eee7d8]
                            "
                          >
                            Nouvelles activités
                          </p>

                          <p
                            className="
                              mt-1
                              text-[11px]
                              leading-5
                              text-[#807765]
                            "
                          >
                            Consultez les inscriptions
                            récentes dans la section
                            Participants.
                          </p>
                        </div>

                      </div>
                    </div>
                  ) : (
                    <div
                      className="
                        py-6
                        text-center
                      "
                    >
                      <div
                        className="
                          mx-auto
                          flex
                          h-10
                          w-10
                          items-center
                          justify-center
                          rounded-full
                          bg-[#181611]
                        "
                      >
                        <Bell
                          className="
                            h-4
                            w-4
                            text-[#655e50]
                          "
                        />
                      </div>

                      <p
                        className="
                          mt-3
                          text-xs
                          font-bold
                          text-[#a59b89]
                        "
                      >
                        Aucune notification
                      </p>

                      <p
                        className="
                          mt-1
                          text-[11px]
                          text-[#625c50]
                        "
                      >
                        Tout est à jour.
                      </p>
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>

          {/* -------------------------------------------------
              SEPARATOR
          -------------------------------------------------- */}

          <div
            className="
              hidden
              h-8
              w-px
              bg-[#29251d]
              sm:block
            "
          />

          {/* -------------------------------------------------
              USER
          -------------------------------------------------- */}

          <div
            ref={profileRef}
            className="relative"
          >
            <button
              type="button"
              onClick={handleProfileClick}
              className="
                flex
                min-h-10
                items-center
                gap-2
                rounded-xl
                border
                border-transparent
                px-1
                py-1
                transition
                hover:border-[#30291d]
                hover:bg-[#11100e]
              "
            >

              {/* Avatar */}
              <div
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-gradient-to-br
                  from-[#d9bc73]
                  to-[#806327]
                  text-sm
                  font-black
                  text-[#17130b]
                  shadow-lg
                "
              >
                {getInitials(username)}
              </div>

              {/* Name */}
              <div
                className="
                  hidden
                  min-w-0
                  text-left
                  sm:block
                "
              >
                <p
                  className="
                    max-w-[130px]
                    truncate
                    text-xs
                    font-black
                    text-[#eee7d8]
                  "
                >
                  {username}
                </p>

                <p
                  className="
                    text-[10px]
                    font-medium
                    text-[#766f60]
                  "
                >
                  Administrateur
                </p>
              </div>

              <ChevronDown
                className={`
                  hidden
                  h-4
                  w-4
                  text-[#776e5d]
                  transition
                  sm:block
                  ${
                    profileOpen
                      ? "rotate-180"
                      : ""
                  }
                `}
              />

            </button>

            {/* -------------------------------------------------
                PROFILE DROPDOWN
            -------------------------------------------------- */}

            {profileOpen && (
              <div
                className="
                  absolute
                  right-0
                  top-[52px]
                  w-[250px]
                  overflow-hidden
                  rounded-2xl
                  border
                  border-[#30291d]
                  bg-[#11100e]
                  shadow-2xl
                  shadow-black/60
                "
              >

                {/* User identity */}
                <div
                  className="
                    border-b
                    border-[#29241b]
                    p-4
                  "
                >
                  <div className="flex items-center gap-3">

                    <div
                      className="
                        flex
                        h-11
                        w-11
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        bg-gradient-to-br
                        from-[#d9bc73]
                        to-[#806327]
                        font-black
                        text-[#17130b]
                      "
                    >
                      {getInitials(username)}
                    </div>

                    <div className="min-w-0">

                      <p
                        className="
                          truncate
                          text-sm
                          font-black
                          text-[#f3ecde]
                        "
                      >
                        {username}
                      </p>

                      <p
                        className="
                          mt-0.5
                          text-[11px]
                          text-[#756d5d]
                        "
                      >
                        Administrateur SiloCamp
                      </p>

                    </div>

                  </div>
                </div>

                {/* Menu */}
                <div className="p-2">

                  <Link
                    to="/admin/settings"
                    onClick={() =>
                      setProfileOpen(false)
                    }
                    className="
                      flex
                      items-center
                      gap-3
                      rounded-xl
                      px-3
                      py-3
                      text-xs
                      font-bold
                      text-[#b9af9c]
                      transition
                      hover:bg-[#1a1712]
                      hover:text-[#eee5d3]
                    "
                  >
                    <Settings className="h-4 w-4" />

                    <span>
                      Paramètres
                    </span>
                  </Link>

                  <Link
                    to="/"
                    onClick={() =>
                      setProfileOpen(false)
                    }
                    className="
                      flex
                      items-center
                      gap-3
                      rounded-xl
                      px-3
                      py-3
                      text-xs
                      font-bold
                      text-[#b9af9c]
                      transition
                      hover:bg-[#1a1712]
                      hover:text-[#eee5d3]
                    "
                  >
                    <User className="h-4 w-4" />

                    <span>
                      Voir le site
                    </span>
                  </Link>

                  <div
                    className="
                      my-2
                      h-px
                      bg-[#29241b]
                    "
                  />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-xl
                      px-3
                      py-3
                      text-left
                      text-xs
                      font-bold
                      text-red-400
                      transition
                      hover:bg-red-500/10
                      hover:text-red-300
                    "
                  >
                    <LogOut className="h-4 w-4" />

                    <span>
                      Se déconnecter
                    </span>
                  </button>

                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}

/* ============================================================
   HELPERS
============================================================ */

function getInitials(
  name: string,
): string {
  const value = name.trim();

  if (!value) {
    return "A";
  }

  const parts = value
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}