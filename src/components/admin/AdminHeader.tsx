import {
  useCallback,
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
import { Link, useNavigate } from "react-router-dom";

type AdminHeaderProps = {
  title: string;
  subtitle?: string;
  onLogout?: () => void;
};

type AdminNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  ticketId?: string | null;
  read: boolean;
  createdAt: string;
};

function formatRelativeTime(createdAt: string): string {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = Date.now();
  const diff = Math.max(0, now - date.getTime());

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return "À l'instant";
  }

  if (minutes < 60) {
    return `Il y a ${minutes} min`;
  }

  if (hours < 24) {
    return `Il y a ${hours} h`;
  }

  if (days === 1) {
    return "Hier";
  }

  if (days < 7) {
    return `Il y a ${days} jours`;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function getNotificationIcon(type: string): ReactNode {
  if (type === "TICKET_CANCELLED") {
    return (
      <CalendarDays
        size={17}
        strokeWidth={1.8}
        className="text-[#C8A45D]"
      />
    );
  }

  return (
    <ShieldCheck
      size={17}
      strokeWidth={1.8}
      className="text-[#C8A45D]"
    />
  );
}

export default function AdminHeader({
  title,
  subtitle,
  onLogout,
}: AdminHeaderProps) {
  const navigate = useNavigate();

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const [notifications, setNotifications] = useState<AdminNotification[]>(
    [],
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(
    null,
  );
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const notificationRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const currentDate = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  /**
   * Récupère les notifications depuis l'API.
   */
  const fetchNotifications = useCallback(
    async (silent = false) => {
      try {
        if (!silent) {
          setNotificationsLoading(true);
        }

        const response = await fetch("/api/notifications", {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.error ||
              data?.message ||
              "Impossible de récupérer les notifications.",
          );
        }

        setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
        setUnreadCount(
          typeof data?.unreadCount === "number" ? data.unreadCount : 0,
        );
        setNotificationsError(null);
      } catch (error) {
        console.error("Erreur notifications:", error);

        if (!silent) {
          setNotificationsError(
            error instanceof Error
              ? error.message
              : "Impossible de récupérer les notifications.",
          );
        }
      } finally {
        if (!silent) {
          setNotificationsLoading(false);
        }
      }
    },
    [],
  );

  /**
   * Chargement initial + actualisation automatique.
   */
  useEffect(() => {
    void fetchNotifications();

    const interval = window.setInterval(() => {
      void fetchNotifications(true);
    }, 20_000);

    const handleFocus = () => {
      void fetchNotifications(true);
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchNotifications]);

  /**
   * Fermeture des menus lorsque l'on clique à l'extérieur.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        notificationRef.current &&
        !notificationRef.current.contains(target)
      ) {
        setNotificationOpen(false);
      }

      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /**
   * Touche Escape.
   */
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      setNotificationOpen(false);
      setUserMenuOpen(false);
      setSearchOpen(false);
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  /**
   * Focus automatique du champ de recherche.
   */
  useEffect(() => {
    if (searchOpen) {
      window.setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [searchOpen]);

  /**
   * Marquer une notification comme lue.
   */
  const markNotificationAsRead = async (id: string) => {
    const notification = notifications.find((item) => item.id === id);

    if (!notification || notification.read) {
      return;
    }

    // Mise à jour optimiste de l'interface.
    setNotifications((current) =>
      current.map((item) =>
        item.id === id ? { ...item, read: true } : item,
      ),
    );

    setUnreadCount((current) => Math.max(0, current - 1));

    try {
      const response = await fetch(
        `/api/notifications/${encodeURIComponent(id)}/read`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Impossible de marquer la notification comme lue.");
      }
    } catch (error) {
      console.error("Erreur lecture notification:", error);

      // On resynchronise avec la base.
      void fetchNotifications(true);
    }
  };

  /**
   * Marquer toutes les notifications comme lues.
   */
  const markAllNotificationsAsRead = async () => {
    if (unreadCount === 0 || markingAllRead) {
      return;
    }

    setMarkingAllRead(true);

    // Mise à jour optimiste.
    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        read: true,
      })),
    );

    setUnreadCount(0);

    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "PATCH",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          "Impossible de marquer toutes les notifications comme lues.",
        );
      }
    } catch (error) {
      console.error("Erreur lecture notifications:", error);

      void fetchNotifications(true);
    } finally {
      setMarkingAllRead(false);
    }
  };

  /**
   * Ouvre / ferme le panneau des notifications.
   */
  const toggleNotifications = () => {
    setNotificationOpen((current) => !current);
    setUserMenuOpen(false);

    // On recharge silencieusement à chaque ouverture.
    void fetchNotifications(true);
  };

  /**
   * Recherche dans les billets.
   */
  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const value = searchValue.trim();

    if (!value) {
      return;
    }

    navigate(`/admin/tickets?search=${encodeURIComponent(value)}`);
    setSearchOpen(false);
  };

  /**
   * Déconnexion.
   */
  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      if (onLogout) {
        await onLogout();
      } else {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });

        navigate("/admin/login");
      }
    } catch (error) {
      console.error("Erreur déconnexion:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="relative z-40 border-b border-white/[0.06] bg-[#080807]">
      <div className="mx-auto flex min-h-[78px] w-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* GAUCHE */}
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#C8A45D]/20 bg-[#C8A45D]/[0.06] sm:flex">
              <ShieldCheck
                size={18}
                strokeWidth={1.7}
                className="text-[#C8A45D]"
              />
            </div>

            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C8A45D]">
                Administration
              </p>

              <h1 className="truncate text-base font-semibold text-[#F5F5F2] sm:text-lg">
                {title}
              </h1>

              {subtitle && (
                <p className="mt-0.5 hidden truncate text-xs text-white/40 md:block">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* DROITE */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* DATE */}
          <div className="hidden items-center gap-2 text-right lg:flex">
            <CalendarDays
              size={16}
              strokeWidth={1.7}
              className="text-white/35"
            />

            <span className="text-xs capitalize text-white/45">
              {currentDate}
            </span>
          </div>

          {/* RECHERCHE */}
          <div className="relative">
            {searchOpen && (
              <form
                onSubmit={handleSearchSubmit}
                className="absolute right-0 top-12 z-50 flex w-[min(320px,calc(100vw-32px))] items-center gap-2 rounded-2xl border border-white/[0.08] bg-[#0D0D0D] p-2 shadow-2xl shadow-black/40"
              >
                <Search
                  size={16}
                  strokeWidth={1.7}
                  className="ml-2 shrink-0 text-white/30"
                />

                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Rechercher un billet..."
                  className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-[#F5F5F2] outline-none placeholder:text-white/25"
                />

                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchValue("");
                  }}
                  className="rounded-lg p-2 text-white/35 transition hover:bg-white/[0.05] hover:text-white"
                  aria-label="Fermer la recherche"
                >
                  <X size={16} />
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => {
                setSearchOpen((current) => !current);
                setNotificationOpen(false);
                setUserMenuOpen(false);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.02] text-white/55 transition hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-white"
              aria-label="Rechercher"
            >
              <Search size={18} strokeWidth={1.7} />
            </button>
          </div>

          {/* NOTIFICATIONS */}
          <div ref={notificationRef} className="relative">
            <button
              type="button"
              onClick={toggleNotifications}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.02] text-white/55 transition hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-white"
              aria-label="Notifications"
              aria-expanded={notificationOpen}
            >
              <Bell size={18} strokeWidth={1.7} />

              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex min-w-[19px] items-center justify-center rounded-full border-2 border-[#080807] bg-[#C8A45D] px-1 py-0.5 text-[9px] font-bold leading-none text-[#080807]">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <NotificationPanel
                notifications={notifications}
                unreadCount={unreadCount}
                loading={notificationsLoading}
                error={notificationsError}
                markingAllRead={markingAllRead}
                onClose={() => setNotificationOpen(false)}
                onMarkRead={markNotificationAsRead}
                onMarkAllRead={markAllNotificationsAsRead}
                onRetry={() => void fetchNotifications()}
              />
            )}
          </div>

          {/* MENU UTILISATEUR */}
          <div ref={userMenuRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setUserMenuOpen((current) => !current);
                setNotificationOpen(false);
              }}
              className="flex h-10 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-2.5 text-white/60 transition hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-white sm:px-3"
              aria-expanded={userMenuOpen}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#24104F] text-[#C8A45D]">
                <User size={15} strokeWidth={1.7} />
              </span>

              <span className="hidden text-xs font-medium sm:block">
                Admin
              </span>

              <ChevronDown
                size={14}
                strokeWidth={1.7}
                className={`hidden transition-transform sm:block ${
                  userMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {userMenuOpen && (
              <UserMenu
                loggingOut={loggingOut}
                onLogout={handleLogout}
                onClose={() => setUserMenuOpen(false)}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/* ============================================================
   PANNEAU NOTIFICATIONS
   ============================================================ */

type NotificationPanelProps = {
  notifications: AdminNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markingAllRead: boolean;
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onRetry: () => void;
};

function NotificationPanel({
  notifications,
  unreadCount,
  loading,
  error,
  markingAllRead,
  onClose,
  onMarkRead,
  onMarkAllRead,
  onRetry,
}: NotificationPanelProps) {
  return (
    <div className="absolute right-0 top-12 z-50 w-[min(380px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0D0D0D] shadow-2xl shadow-black/50">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3.5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C8A45D]">
            Notifications
          </p>

          <p className="mt-1 text-xs text-white/35">
            {unreadCount > 0
              ? `${unreadCount} notification${
                  unreadCount > 1 ? "s" : ""
                } non lue${unreadCount > 1 ? "s" : ""}`
              : "Toutes les notifications sont lues"}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/[0.05] hover:text-white"
          aria-label="Fermer"
        >
          <X size={16} />
        </button>
      </div>

      {/* ACTION */}
      {unreadCount > 0 && (
        <div className="border-b border-white/[0.05] px-4 py-2.5">
          <button
            type="button"
            onClick={onMarkAllRead}
            disabled={markingAllRead}
            className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C8A45D] transition hover:text-[#E0C17A] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {markingAllRead
              ? "Mise à jour..."
              : "Tout marquer comme lu"}
          </button>
        </div>
      )}

      {/* CONTENU */}
      <div className="max-h-[min(520px,calc(100vh-180px))] overflow-y-auto">
        {loading && notifications.length === 0 ? (
          <div className="flex min-h-[180px] items-center justify-center px-6">
            <div className="text-center">
              <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-[#C8A45D]" />

              <p className="mt-4 text-xs text-white/35">
                Chargement des notifications...
              </p>
            </div>
          </div>
        ) : error && notifications.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/15 bg-red-500/[0.06]">
              <X
                size={17}
                strokeWidth={1.8}
                className="text-red-400"
              />
            </div>

            <p className="mt-4 text-sm font-medium text-white/75">
              Impossible de charger les notifications
            </p>

            <p className="mt-1 text-xs leading-5 text-white/35">
              {error}
            </p>

            <button
              type="button"
              onClick={onRetry}
              className="mt-4 rounded-lg border border-white/[0.08] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 transition hover:border-white/[0.14] hover:text-white"
            >
              Réessayer
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#C8A45D]/15 bg-[#C8A45D]/[0.05]">
              <Bell
                size={19}
                strokeWidth={1.7}
                className="text-[#C8A45D]/70"
              />
            </div>

            <p className="mt-4 text-sm font-medium text-white/65">
              Aucune notification
            </p>

            <p className="mt-1 max-w-[250px] text-xs leading-5 text-white/30">
              Les nouvelles activités de la plateforme apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={onMarkRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   NOTIFICATION ITEM
   ============================================================ */

type NotificationItemProps = {
  notification: AdminNotification;
  onMarkRead: (id: string) => void;
};

function NotificationItem({
  notification,
  onMarkRead,
}: NotificationItemProps) {
  return (
    <button
      type="button"
      onClick={() => onMarkRead(notification.id)}
      className={`group flex w-full gap-3 px-4 py-4 text-left transition ${
        notification.read
          ? "bg-transparent hover:bg-white/[0.02]"
          : "bg-[#C8A45D]/[0.045] hover:bg-[#C8A45D]/[0.07]"
      }`}
    >
      <div
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
          notification.read
            ? "border-white/[0.07] bg-white/[0.025]"
            : "border-[#C8A45D]/20 bg-[#C8A45D]/[0.07]"
        }`}
      >
        {getNotificationIcon(notification.type)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p
            className={`text-xs font-semibold ${
              notification.read
                ? "text-white/60"
                : "text-[#F5F5F2]"
            }`}
          >
            {notification.title}
          </p>

          {!notification.read && (
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C8A45D]" />
          )}
        </div>

        <p className="mt-1 text-xs leading-5 text-white/35">
          {notification.message}
        </p>

        <p className="mt-2 text-[10px] uppercase tracking-[0.1em] text-white/20">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
    </button>
  );
}

/* ============================================================
   MENU UTILISATEUR
   ============================================================ */

type UserMenuProps = {
  loggingOut: boolean;
  onLogout: () => void;
  onClose: () => void;
};

function UserMenu({
  loggingOut,
  onLogout,
  onClose,
}: UserMenuProps) {
  return (
    <div className="absolute right-0 top-12 z-50 w-[230px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0D0D0D] shadow-2xl shadow-black/50">
      <div className="border-b border-white/[0.06] px-4 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C8A45D]">
          Compte
        </p>

        <div className="mt-2 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#24104F] text-[#C8A45D]">
            <User size={17} strokeWidth={1.7} />
          </div>

          <div>
            <p className="text-sm font-medium text-white/75">
              Administrateur
            </p>

            <p className="text-[11px] text-white/30">
              Gestion SiloCamp
            </p>
          </div>
        </div>
      </div>

      <div className="p-2">
        <Link
          to="/admin/settings"
          onClick={onClose}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-white/50 transition hover:bg-white/[0.04] hover:text-white"
        >
          <Settings size={16} strokeWidth={1.7} />
          <span>Paramètres</span>
        </Link>

        <a
          href="/"
          onClick={onClose}
          className="flex items-center justify-between rounded-xl px-3 py-2.5 text-xs text-white/50 transition hover:bg-white/[0.04] hover:text-white"
        >
          <span className="flex items-center gap-3">
            <ExternalLink size={16} strokeWidth={1.7} />
            Retour au site
          </span>

          <span className="text-white/20">↗</span>
        </a>

        <div className="my-2 h-px bg-white/[0.05]" />

        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-white/45 transition hover:bg-red-500/[0.06] hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <LogOut size={16} strokeWidth={1.7} />

          <span>
            {loggingOut ? "Déconnexion..." : "Se déconnecter"}
          </span>
        </button>
      </div>
    </div>
  );
}