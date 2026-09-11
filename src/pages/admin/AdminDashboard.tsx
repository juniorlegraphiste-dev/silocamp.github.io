import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Ticket,
  Users,
  UserRound,
  Baby,
  UserPlus,
  XCircle,
  CalendarDays,
} from "lucide-react";

import {
  getTicketStats,
  getTickets,
  type Ticket as TicketType,
  type TicketStats,
} from "@/services/ticketService";

import { Reveal } from "@/components/Reveal";

type DashboardData = {
  stats: TicketStats;
  tickets: TicketType[];
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [stats, tickets] = await Promise.all([
        getTicketStats(),
        getTickets(),
      ]);

      setData({
        stats,
        tickets,
      });
    } catch (err) {
      console.error(
        "[SiloCamp Admin] Erreur chargement dashboard :",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les statistiques.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const dashboard = useMemo(() => {
    if (!data) {
      return null;
    }

    const { stats, tickets } = data;

    const validTickets = tickets.filter(
      (ticket) => ticket.status === "VALID",
    );

    const usedTickets = tickets.filter(
      (ticket) => ticket.status === "USED",
    );

    const cancelledTickets = tickets.filter(
      (ticket) => ticket.status === "CANCELLED",
    );

    /*
     * =====================================================
     * PARTICIPANTS PRINCIPAUX
     *
     * Chaque inscription représente un participant principal.
     * =====================================================
     */

    const mainParticipants = tickets.filter(
      (ticket) => ticket.status !== "CANCELLED",
    ).length;

    /*
     * =====================================================
     * ENFANTS DE MOINS DE 12 ANS
     *
     * Informés pour l'organisation.
     * Ne consomment pas de place.
     * =====================================================
     */

    const childrenUnder12 = tickets
      .filter((ticket) => ticket.status !== "CANCELLED")
      .reduce(
        (total, ticket) =>
          total + Number(ticket.childrenUnder12 ?? 0),
        0,
      );

    /*
     * =====================================================
     * ENFANTS DE 12 ANS ET PLUS
     *
     * Consomment une place.
     * =====================================================
     */

    const children12Plus = tickets
      .filter((ticket) => ticket.status !== "CANCELLED")
      .reduce(
        (total, ticket) =>
          total + Number(ticket.children12Plus ?? 0),
        0,
      );

    /*
     * =====================================================
     * TOTAL ENFANTS
     * =====================================================
     */

    const totalChildren =
      childrenUnder12 + children12Plus;

    /*
     * =====================================================
     * TOTAL PERSONNES PRÉSENTES
     *
     * Participant principal
     * + tous les enfants
     *
     * Les enfants -12 ne consomment pas une place,
     * mais ils sont physiquement présents.
     * =====================================================
     */

    const totalPeople =
      mainParticipants + totalChildren;

    /*
     * =====================================================
     * ACCOMPAGNANTS
     *
     * Tous les enfants enregistrés.
     * =====================================================
     */

    const totalAccompanying =
      totalChildren;

    /*
     * =====================================================
     * PLACES CONSOMMÉES
     *
     * On utilise la valeur officielle
     * retournée par l'API.
     * =====================================================
     */

    const consumedPlaces = stats.reserved;

    /*
     * =====================================================
     * TAUX DE REMPLISSAGE
     * =====================================================
     */

    const usagePercentage =
      stats.capacity > 0
        ? Math.min(
            100,
            Math.round(
              (consumedPlaces / stats.capacity) * 100,
            ),
          )
        : 0;

    /*
     * =====================================================
     * DERNIÈRES INSCRIPTIONS
     * =====================================================
     */

    const recentTickets = [...tickets]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();

        return dateB - dateA;
      })
      .slice(0, 8);

    return {
      stats,

      tickets,

      validTickets,

      usedTickets,

      cancelledTickets,

      mainParticipants,

      childrenUnder12,

      children12Plus,

      totalChildren,

      totalPeople,

      totalAccompanying,

      consumedPlaces,

      usagePercentage,

      recentTickets,
    };
  }, [data]);

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-gold-300" />

          <p className="mt-4 text-sm text-cream-dim">
            Chargement du tableau de bord...
          </p>
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * ERROR
   * =========================================================
   */

  if (error || !dashboard) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-3xl border border-red-400/20 bg-red-400/5 p-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-400" />

          <h1 className="mt-5 font-display text-3xl text-cream">
            Impossible de charger le tableau de bord
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-cream-dim">
            {error || "Une erreur inconnue est survenue."}
          </p>

          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="btn-gold mt-6 inline-flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />

            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const {
    stats,
    tickets,

    validTickets,
    usedTickets,
    cancelledTickets,

    mainParticipants,

    childrenUnder12,
    children12Plus,

    totalChildren,
    totalPeople,
    totalAccompanying,

    consumedPlaces,
    usagePercentage,

    recentTickets,
  } = dashboard;

  return (
    <div className="min-h-full p-5 md:p-8 lg:p-10">
      <div className="mx-auto max-w-7xl">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <Reveal>
          <div className="flex flex-col gap-6 border-b border-gold-400/10 pb-8 md:flex-row md:items-end md:justify-between">

            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gold-400/20 bg-gold-400/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-gold-300">
                <BarChart3 className="h-4 w-4" />

                Administration
              </div>

              <h1 className="mt-5 font-display text-4xl font-medium text-cream sm:text-5xl">
                Tableau de bord{" "}

                <span className="text-gold-gradient">
                  SiloCamp
                </span>
              </h1>

              <p className="mt-3 text-base text-cream-dim">
                Suivez les inscriptions, les familles et la
                disponibilité en temps réel.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadDashboard(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-gold-400/30 px-5 py-3 text-sm font-medium text-gold-300 transition hover:bg-gold-400/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />

              {refreshing
                ? "Actualisation..."
                : "Actualiser"}
            </button>

          </div>
        </Reveal>

        {/* =====================================================
            STATISTIQUES PRINCIPALES
        ===================================================== */}

        <Reveal className="mt-10">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

            <StatCard
              title="Capacité totale"
              value={stats.capacity}
              description="Places disponibles au total"
              icon={<Users className="h-6 w-6" />}
            />

            <StatCard
              title="Places consommées"
              value={consumedPlaces}
              description="Places réellement réservées"
              icon={<Ticket className="h-6 w-6" />}
              highlight
            />

            <StatCard
              title="Places restantes"
              value={stats.remaining}
              description="Encore disponibles"
              icon={<CheckCircle2 className="h-6 w-6" />}
              success
            />

            <StatCard
              title="Taux de remplissage"
              value={`${usagePercentage}%`}
              description={`${consumedPlaces} / ${stats.capacity} places`}
              icon={<BarChart3 className="h-6 w-6" />}
            />

          </div>
        </Reveal>

        {/* =====================================================
            ACCOMPAGNEMENT FAMILIAL
        ===================================================== */}

        <Reveal className="mt-10">

          <div className="mb-5">
            <h2 className="font-display text-2xl text-cream">
              Accompagnement familial
            </h2>

            <p className="mt-1 text-sm text-cream-dim">
              Suivi des participants et des enfants accompagnateurs.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

            <StatCard
              title="Participants principaux"
              value={mainParticipants}
              description="Inscriptions actives"
              icon={<UserRound className="h-6 w-6" />}
            />

            <StatCard
              title="Enfants -12 ans"
              value={childrenUnder12}
              description="Présents sans consommer de place"
              icon={<Baby className="h-6 w-6" />}
            />

            <StatCard
              title="Enfants 12 ans +"
              value={children12Plus}
              description="Consomment une place"
              icon={<UserPlus className="h-6 w-6" />}
              highlight
            />

            <StatCard
              title="Total personnes"
              value={totalPeople}
              description={`${totalAccompanying} accompagnant${
                totalAccompanying > 1 ? "s" : ""
              }`}
              icon={<Users className="h-6 w-6" />}
              success
            />

          </div>

          <div className="mt-5 rounded-3xl border border-gold-400/12 bg-ink-900/40 p-5">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="text-sm text-cream-dim">
                  Total des enfants accompagnateurs
                </p>

                <div className="mt-1 font-display text-3xl text-cream">
                  {totalChildren}
                </div>
              </div>

              <div className="rounded-2xl border border-gold-400/15 bg-gold-400/5 px-5 py-4">
                <p className="text-xs uppercase tracking-wider text-gold-300">
                  Règle de réservation
                </p>

                <p className="mt-1 text-sm text-cream-dim">
                  1 adulte + enfants de 12 ans et plus
                  consomment les places.
                </p>
              </div>

            </div>

          </div>

        </Reveal>

        {/* =====================================================
            ÉTAT DES BILLETS
        ===================================================== */}

        <Reveal className="mt-10">

          <div className="mb-5">
            <h2 className="font-display text-2xl text-cream">
              État des billets
            </h2>

            <p className="mt-1 text-sm text-cream-dim">
              Suivi des inscriptions et des entrées.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">

            <StatusCard
              title="Billets valides"
              value={
                stats.validTickets ?? validTickets.length
              }
              icon={<Ticket className="h-6 w-6" />}
              description="Participants inscrits"
            />

            <StatusCard
              title="Billets utilisés"
              value={
                stats.usedTickets ?? usedTickets.length
              }
              icon={<CheckCircle2 className="h-6 w-6" />}
              description="Participants entrés"
              success
            />

            <StatusCard
              title="Billets annulés"
              value={
                stats.cancelledTickets ??
                cancelledTickets.length
              }
              icon={<XCircle className="h-6 w-6" />}
              description="Inscriptions annulées"
              danger
            />

          </div>

        </Reveal>

        {/* =====================================================
            PROGRESSION
        ===================================================== */}

        <Reveal className="mt-10">

          <section className="rounded-3xl border border-gold-400/12 bg-ink-900/40 p-6 sm:p-8">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="font-display text-2xl text-cream">
                  Remplissage de l'événement
                </h2>

                <p className="mt-1 text-sm text-cream-dim">
                  {consumedPlaces} places consommées sur{" "}
                  {stats.capacity}.
                </p>
              </div>

              <div className="text-left sm:text-right">
                <div className="font-display text-4xl text-gold-300">
                  {usagePercentage}%
                </div>

                <p className="text-xs text-cream-faint">
                  Taux d'occupation
                </p>
              </div>

            </div>

            <div className="mt-6 h-4 overflow-hidden rounded-full bg-white/[0.05]">

              <div
                className="h-full rounded-full bg-gold-400 transition-all duration-700"
                style={{
                  width: `${usagePercentage}%`,
                }}
              />

            </div>

            <div className="mt-4 flex justify-between text-xs text-cream-faint">
              <span>0 place</span>

              <span>
                {stats.capacity} places
              </span>
            </div>

          </section>

        </Reveal>

        {/* =====================================================
            DERNIÈRES INSCRIPTIONS
        ===================================================== */}

        <Reveal className="mt-10">

          <section className="overflow-hidden rounded-3xl border border-gold-400/12 bg-ink-900/40">

            <div className="flex flex-col gap-4 border-b border-gold-400/10 p-6 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="font-display text-2xl text-cream">
                  Dernières inscriptions
                </h2>

                <p className="mt-1 text-sm text-cream-dim">
                  {tickets.length} inscription
                  {tickets.length > 1 ? "s" : ""} enregistrée
                  {tickets.length > 1 ? "s" : ""}
                </p>
              </div>

              <div className="inline-flex items-center gap-2 text-sm text-cream-faint">
                <CalendarDays className="h-4 w-4" />

                Les 8 dernières réservations
              </div>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full min-w-[900px] text-left">

                <thead className="border-b border-gold-400/10 bg-white/[0.02]">

                  <tr className="text-xs uppercase tracking-wider text-cream-faint">

                    <th className="px-6 py-4 font-medium">
                      Participant
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Contact
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Places
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Famille
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Statut
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Date
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {recentTickets.length === 0 ? (

                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-sm text-cream-faint"
                      >
                        Aucun participant enregistré.
                      </td>
                    </tr>

                  ) : (

                    recentTickets.map((ticket) => {

                      const under12 = Number(
                        ticket.childrenUnder12 ?? 0,
                      );

                      const childrenPlus = Number(
                        ticket.children12Plus ?? 0,
                      );

                      const childrenTotal =
                        under12 + childrenPlus;

                      return (
                        <tr
                          key={ticket.id}
                          className="border-b border-white/[0.05] transition hover:bg-white/[0.02]"
                        >

                          <td className="px-6 py-4">

                            <div className="font-medium text-cream">
                              {ticket.participantName}
                            </div>

                            <div className="mt-1 text-xs text-cream-faint">
                              {ticket.ticketNumber}
                            </div>

                          </td>

                          <td className="px-6 py-4">

                            <div className="text-sm text-cream-dim">
                              {ticket.email}
                            </div>

                            {ticket.phone && (
                              <div className="mt-1 text-xs text-cream-faint">
                                {ticket.phone}
                              </div>
                            )}

                          </td>

                          <td className="px-6 py-4">

                            <span className="font-semibold text-gold-300">
                              {ticket.quantity}
                            </span>

                          </td>

                          <td className="px-6 py-4">

                            <div className="text-sm text-cream-dim">
                              {childrenTotal === 0
                                ? "Aucun enfant"
                                : `${childrenTotal} enfant${
                                    childrenTotal > 1
                                      ? "s"
                                      : ""
                                  }`}
                            </div>

                            {childrenTotal > 0 && (
                              <div className="mt-1 text-xs text-cream-faint">
                                -12 : {under12} · 12+ :{" "}
                                {childrenPlus}
                              </div>
                            )}

                          </td>

                          <td className="px-6 py-4">
                            <StatusBadge
                              status={ticket.status}
                            />
                          </td>

                          <td className="px-6 py-4 text-sm text-cream-faint">
                            {formatDate(ticket.createdAt)}
                          </td>

                        </tr>
                      );
                    })

                  )}

                </tbody>

              </table>

            </div>

          </section>

        </Reveal>

      </div>
    </div>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function StatCard({
  title,
  value,
  description,
  icon,
  highlight,
  success,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  highlight?: boolean;
  success?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-6 transition ${
        success
          ? "border-emerald-500/20 bg-emerald-500/5"
          : highlight
            ? "border-gold-400/30 bg-gold-400/5"
            : "border-gold-400/12 bg-ink-900/40"
      }`}
    >
      <div className="flex items-start justify-between gap-4">

        <div>
          <p className="text-sm text-cream-dim">
            {title}
          </p>

          <div className="mt-3 font-display text-4xl text-cream">
            {value}
          </div>

          <p className="mt-2 text-xs text-cream-faint">
            {description}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
            success
              ? "bg-emerald-500/10 text-emerald-300"
              : highlight
                ? "bg-gold-400/10 text-gold-300"
                : "bg-white/[0.04] text-gold-300"
          }`}
        >
          {icon}
        </div>

      </div>
    </div>
  );
}

function StatusCard({
  title,
  value,
  description,
  icon,
  success,
  danger,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  success?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-gold-400/12 bg-ink-900/40 p-6">

      <div className="flex items-center gap-4">

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
            success
              ? "bg-emerald-500/10 text-emerald-300"
              : danger
                ? "bg-red-500/10 text-red-300"
                : "bg-gold-400/10 text-gold-300"
          }`}
        >
          {icon}
        </div>

        <div>
          <p className="text-sm text-cream-dim">
            {title}
          </p>

          <div className="mt-1 font-display text-3xl text-cream">
            {value}
          </div>

          <p className="mt-1 text-xs text-cream-faint">
            {description}
          </p>
        </div>

      </div>

    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: TicketType["status"];
}) {
  const config = {
    VALID: {
      label: "Valide",
      className:
        "border-gold-400/20 bg-gold-400/10 text-gold-300",
    },

    USED: {
      label: "Utilisé",
      className:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    },

    CANCELLED: {
      label: "Annulé",
      className:
        "border-red-500/20 bg-red-500/10 text-red-300",
    },
  };

  const current = config[status];

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${current.className}`}
    >
      {current.label}
    </span>
  );
}

function formatDate(value: string | Date) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}