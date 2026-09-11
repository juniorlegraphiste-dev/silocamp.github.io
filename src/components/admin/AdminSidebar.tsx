import {
  BarChart3,
  CalendarDays,
  Camera,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Ticket,
  X,
} from "lucide-react";

import { useState } from "react";

import { NavLink } from "react-router-dom";

const navigation = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Participants",
    href: "/admin/tickets",
    icon: Ticket,
  },
  {
    name: "Statistiques",
    href: "/admin/statistics",
    icon: BarChart3,
  },
  {
    name: "Paramètres",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* =====================================================
          MOBILE HEADER
      ===================================================== */}

      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-gold-400/10 bg-ink-950/95 px-5 backdrop-blur lg:hidden">
        <NavLink
          to="/admin/dashboard"
          className="font-display text-xl text-cream"
        >
          Silo<span className="text-gold-300">Camp</span>
        </NavLink>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold-400/20 text-gold-300"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {mobileOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`fixed inset-y-0 left-0 z-[70] flex w-72 flex-col border-r border-gold-400/10 bg-ink-950 transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* =====================================================
            LOGO
        ===================================================== */}

        <div className="flex h-20 items-center justify-between border-b border-gold-400/10 px-7">
          <NavLink
            to="/admin/dashboard"
            className="flex items-center gap-3"
            onClick={() => setMobileOpen(false)}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-400/10">
              <CalendarDays className="h-5 w-5 text-gold-300" />
            </div>

            <div>
              <div className="font-display text-xl text-cream">
                Silo<span className="text-gold-300">Camp</span>
              </div>

              <p className="text-[10px] uppercase tracking-[0.2em] text-cream-faint">
                Administration
              </p>
            </div>
          </NavLink>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-cream-dim lg:hidden"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* =====================================================
            NAVIGATION
        ===================================================== */}

        <nav className="flex-1 space-y-2 px-4 py-7">
          <p className="mb-4 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-cream-faint">
            Menu principal
          </p>

          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-gold-400/10 text-gold-300"
                      : "text-cream-dim hover:bg-white/[0.04] hover:text-cream"
                  }`
                }
              >
                <Icon className="h-5 w-5" />

                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <div className="border-t border-gold-400/10 p-5">
          <div className="rounded-2xl border border-gold-400/10 bg-white/[0.02] p-4">
            <p className="text-sm font-medium text-cream">
              Administration
            </p>

            <p className="mt-1 text-xs text-cream-faint">
              Gestion de l'événement SiloCamp
            </p>
          </div>

          <NavLink
            to="/"
            className="mt-4 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-cream-dim transition hover:bg-white/[0.04] hover:text-cream"
          >
            <LogOut className="h-4 w-4" />

            Retour au site
          </NavLink>
        </div>
      </aside>

      {/* =====================================================
          MOBILE SPACING
      ===================================================== */}

      <div className="h-16 lg:hidden" />
    </>
  );
}