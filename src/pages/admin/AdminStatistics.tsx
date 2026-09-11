import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  Baby,
  BarChart3,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Ticket,
  TrendingUp,
  UserCheck,
  Users,
  UserRound,
  XCircle,
} from "lucide-react";

import {
  getTicketStats,
  getTickets,
  type Ticket as TicketType,
  type TicketStats,
} from "@/services/ticketService";

import { Reveal } from "@/components/Reveal";

/* =========================================================
   TYPES
========================================================= */

type StatisticsData = {
  stats: TicketStats;
  tickets: TicketType[];
};

/* =========================================================
   PAGE
========================================================= */

export default function AdminStatistics() {
  const [data, setData] =
    useState<StatisticsData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =========================================================
     LOAD DATA
  ========================================================= */

  const loadStatistics = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const [stats, tickets] =
          await Promise.all([
            getTicketStats(),
            getTickets(),
          ]);

        setData({
          stats,
          tickets,
        });
      } catch (err) {
        console.error(
          "[SiloCamp Admin Statistics] Erreur :",
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
    },
    [],
  );

  useEffect(() => {
    void loadStatistics();
  }, [loadStatistics]);

  /* =========================================================
     CALCULATIONS
  ========================================================= */

  const calculations = useMemo(() => {
    if (!data) {
      return {
        occupancyRate: 0,
        attendanceRate: 0,
        cancellationRate: 0,
        childrenUnder12: 0,
        children12Plus: 0,
        totalChildren: 0,
        totalPeople: 0,
        validPeople: 0,
        usedPeople: 0,
        cancelledPeople: 0,
        averagePlaces: 0,
      };
    }

    const { stats, tickets } = data;

    /* -------------------------------------------------------
       OCCUPANCY RATE
    ------------------------------------------------------- */

    const occupancyRate =
      stats.capacity > 0
        ? Math.min(
            (stats.reserved /
              stats.capacity) *
              100,
            100,
          )
        : 0;

    /* -------------------------------------------------------
       ATTENDANCE RATE

       Places utilisées / places réservées
    ------------------------------------------------------- */

    const attendanceRate =
      stats.reserved > 0
        ? Math.min(
            (stats.used /
              stats.reserved) *
              100,
            100,
          )
        : 0;

    /* -------------------------------------------------------
       CANCELLATION RATE
    ------------------------------------------------------- */

    const cancellationRate =
      stats.totalTickets > 0
        ? (stats.cancelledTickets /
            stats.totalTickets) *
          100
        : 0;

    /* -------------------------------------------------------
       CHILDREN
    ------------------------------------------------------- */

    const childrenUnder12 =
      tickets.reduce(
        (total, ticket) =>
          total +
          Number(
            ticket.childrenUnder12 ?? 0,
          ),
        0,
      );

    const children12Plus =
      tickets.reduce(
        (total, ticket) =>
          total +
          Number(
            ticket.children12Plus ?? 0,
          ),
        0,
      );

    const totalChildren =
      childrenUnder12 +
      children12Plus;

    /* -------------------------------------------------------
       PEOPLE

       Participant principal
       + enfants
    ------------------------------------------------------- */

    const totalPeople =
      tickets.reduce(
        (total, ticket) =>
          total +
          1 +
          Number(
            ticket.childrenUnder12 ?? 0,
          ) +
          Number(
            ticket.children12Plus ?? 0,
          ),
        0,
      );

    /* -------------------------------------------------------
       PEOPLE BY STATUS
    ------------------------------------------------------- */

    const validPeople =
      tickets
        .filter(
          (ticket) =>
            ticket.status === "VALID",
        )
        .reduce(
          (total, ticket) =>
            total +
            1 +
            Number(
              ticket.childrenUnder12 ?? 0,
            ) +
            Number(
              ticket.children12Plus ?? 0,
            ),
          0,
        );

    const usedPeople =
      tickets
        .filter(
          (ticket) =>
            ticket.status === "USED",
        )
        .reduce(
          (total, ticket) =>
            total +
            1 +
            Number(
              ticket.childrenUnder12 ?? 0,
            ) +
            Number(
              ticket.children12Plus ?? 0,
            ),
          0,
        );

    const cancelledPeople =
      tickets
        .filter(
          (ticket) =>
            ticket.status === "CANCELLED",
        )
        .reduce(
          (total, ticket) =>
            total +
            1 +
            Number(
              ticket.childrenUnder12 ?? 0,
            ) +
            Number(
              ticket.children12Plus ?? 0,
            ),
          0,
        );

    /* -------------------------------------------------------
       AVERAGE PLACES PER RESERVATION
    ------------------------------------------------------- */

    const averagePlaces =
      stats.totalTickets > 0
        ? stats.reserved /
          stats.totalTickets
        : 0;

    return {
      occupancyRate,
      attendanceRate,
      cancellationRate,
      childrenUnder12,
      children12Plus,
      totalChildren,
      totalPeople,
      validPeople,
      usedPeople,
      cancelledPeople,
      averagePlaces,
    };
  }, [data]);

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-gold-300" />

          <p className="mt-4 text-sm text-cream-dim">
            Chargement des statistiques...
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error || !data) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-20">
        <div className="max-w-lg rounded-3xl border border-red-400/20 bg-red-400/5 p-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-400" />

          <h1 className="mt-5 font-display text-3xl text-cream">
            Impossible de charger les statistiques
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-cream-dim">
            {error ||
              "Les données statistiques sont indisponibles."}
          </p>

          <button
            type="button"
            onClick={() =>
              void loadStatistics()
            }
            className="btn-gold mt-6 inline-flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />

            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const { stats } = data;

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
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
              Statistiques{" "}
              <span className="text-gold-gradient">
                SiloCamp
              </span>
            </h1>

            <p className="mt-3 text-base text-cream-dim">
              Suivez en temps réel les inscriptions,
              les places et la participation.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadStatistics(true)
            }
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-gold-400/30 px-5 py-3 text-sm font-medium text-gold-300 transition hover:bg-gold-400/10 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />

            Actualiser
          </button>
        </div>
      </Reveal>

      {/* =====================================================
          MAIN STATISTICS
      ===================================================== */}

      <Reveal className="mt-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatisticCard
            label="Participants"
            value={stats.totalTickets}
            description="Inscriptions enregistrées"
            icon={<Users className="h-5 w-5" />}
          />

          <StatisticCard
            label="Places réservées"
            value={stats.reserved}
            description={`sur ${stats.capacity} places`}
            icon={<Ticket className="h-5 w-5" />}
            gold
          />

          <StatisticCard
            label="Places restantes"
            value={stats.remaining}
            description="Disponibles actuellement"
            icon={<TrendingUp className="h-5 w-5" />}
            success
          />

          <StatisticCard
            label="Billets utilisés"
            value={stats.usedTickets}
            description={`${calculations.attendanceRate.toFixed(
              1,
            )}% de présence`}
            icon={<UserCheck className="h-5 w-5" />}
          />
        </div>
      </Reveal>

      {/* =====================================================
          TICKETS STATUS
      ===================================================== */}

      <Reveal className="mt-8">
        <div className="grid gap-5 lg:grid-cols-3">
          <StatusCard
            label="Billets valides"
            value={stats.validTickets}
            total={stats.totalTickets}
            icon={
              <CheckCircle2 className="h-5 w-5" />
            }
            type="gold"
          />

          <StatusCard
            label="Billets utilisés"
            value={stats.usedTickets}
            total={stats.totalTickets}
            icon={
              <UserCheck className="h-5 w-5" />
            }
            type="success"
          />

          <StatusCard
            label="Billets annulés"
            value={stats.cancelledTickets}
            total={stats.totalTickets}
            icon={
              <XCircle className="h-5 w-5" />
            }
            type="danger"
          />
        </div>
      </Reveal>

      {/* =====================================================
          PROGRESS
      ===================================================== */}

      <Reveal className="mt-8">
        <section className="rounded-3xl border border-gold-400/12 bg-ink-900/40 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-gold-300" />

            <div>
              <h2 className="font-display text-2xl text-cream">
                Progression de l'événement
              </h2>

              <p className="mt-1 text-sm text-cream-faint">
                Taux de remplissage et participation.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            {/* OCCUPANCY */}

            <ProgressSection
              title="Taux de remplissage"
              value={
                calculations.occupancyRate
              }
              description={`${stats.reserved} places réservées sur ${stats.capacity}`}
              color="gold"
            />

            {/* ATTENDANCE */}

            <ProgressSection
              title="Taux de présence"
              value={
                calculations.attendanceRate
              }
              description={`${stats.used} places utilisées sur ${stats.reserved} réservées`}
              color="success"
            />

            {/* CANCELLATION */}

            <ProgressSection
              title="Taux d'annulation"
              value={
                calculations.cancellationRate
              }
              description={`${stats.cancelledTickets} billet(s) annulé(s)`}
              color="danger"
            />

            {/* AVAILABLE */}

            <ProgressSection
              title="Places disponibles"
              value={
                stats.capacity > 0
                  ? Math.max(
                      (stats.remaining /
                        stats.capacity) *
                        100,
                      0,
                    )
                  : 0
              }
              description={`${stats.remaining} place(s) encore disponible(s)`}
              color="cream"
            />
          </div>
        </section>
      </Reveal>

      {/* =====================================================
          FAMILY STATISTICS
      ===================================================== */}

      <Reveal className="mt-8">
        <section className="rounded-3xl border border-gold-400/12 bg-ink-900/40 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Baby className="h-5 w-5 text-gold-300" />

            <div>
              <h2 className="font-display text-2xl text-cream">
                Statistiques familiales
              </h2>

              <p className="mt-1 text-sm text-cream-faint">
                Analyse des accompagnateurs enregistrés.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <FamilyCard
              label="Enfants -12 ans"
              value={
                calculations.childrenUnder12
              }
              icon={
                <Baby className="h-5 w-5" />
              }
            />

            <FamilyCard
              label="Enfants 12 ans +"
              value={
                calculations.children12Plus
              }
              icon={
                <UserRound className="h-5 w-5" />
              }
            />

            <FamilyCard
              label="Total enfants"
              value={
                calculations.totalChildren
              }
              icon={
                <Users className="h-5 w-5" />
              }
            />

            <FamilyCard
              label="Personnes attendues"
              value={
                calculations.totalPeople
              }
              icon={
                <UserCheck className="h-5 w-5" />
              }
            />
          </div>
        </section>
      </Reveal>

      {/* =====================================================
          PARTICIPATION DETAILS
      ===================================================== */}

      <Reveal className="mt-8">
        <section className="grid gap-5 lg:grid-cols-3">
          <PeopleStatusCard
            label="Personnes avec réservation valide"
            value={calculations.validPeople}
            icon={
              <CheckCircle2 className="h-5 w-5" />
            }
            color="gold"
          />

          <PeopleStatusCard
            label="Personnes déjà entrées"
            value={calculations.usedPeople}
            icon={
              <UserCheck className="h-5 w-5" />
            }
            color="success"
          />

          <PeopleStatusCard
            label="Personnes annulées"
            value={
              calculations.cancelledPeople
            }
            icon={
              <XCircle className="h-5 w-5" />
            }
            color="danger"
          />
        </section>
      </Reveal>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <Reveal className="mt-8">
        <section className="rounded-3xl border border-gold-400/15 bg-gold-400/[0.04] p-6 sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold-300">
                Résumé général
              </p>

              <h2 className="mt-3 font-display text-3xl text-cream">
                {stats.remaining > 0
                  ? "Les inscriptions sont toujours ouvertes"
                  : "La capacité maximale est atteinte"}
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-cream-dim">
                SiloCamp affiche actuellement{" "}
                <span className="font-semibold text-cream">
                  {stats.reserved}
                </span>{" "}
                place
                {stats.reserved > 1
                  ? "s"
                  : ""}{" "}
                réservée
                {stats.reserved > 1
                  ? "s"
                  : ""}{" "}
                sur{" "}
                <span className="font-semibold text-gold-300">
                  {stats.capacity}
                </span>{" "}
                places disponibles.
              </p>
            </div>

            <div className="rounded-3xl border border-gold-400/20 bg-ink-950/30 p-6 text-center">
              <div className="font-display text-5xl text-gold-gradient">
                {calculations.occupancyRate.toFixed(
                  0,
                )}
                %
              </div>

              <p className="mt-2 text-xs uppercase tracking-wider text-cream-faint">
                Remplissage
              </p>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
}

/* =========================================================
   STATISTIC CARD
========================================================= */

function StatisticCard({
  label,
  value,
  description,
  icon,
  gold,
  success,
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  gold?: boolean;
  success?: boolean;
}) {
  const colors = success
    ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
    : gold
      ? "border-gold-400/20 bg-gold-400/5 text-gold-300"
      : "border-white/[0.08] bg-white/[0.02] text-cream";

  return (
    <div
      className={`rounded-3xl border p-6 ${colors}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-cream-dim">
          {label}
        </span>

        {icon}
      </div>

      <div className="mt-6 font-display text-4xl text-cream">
        {value.toLocaleString("fr-FR")}
      </div>

      <p className="mt-2 text-xs text-cream-faint">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   STATUS CARD
========================================================= */

function StatusCard({
  label,
  value,
  total,
  icon,
  type,
}: {
  label: string;
  value: number;
  total: number;
  icon: React.ReactNode;
  type: "gold" | "success" | "danger";
}) {
  const percentage =
    total > 0
      ? Math.min(
          (value / total) * 100,
          100,
        )
      : 0;

  const styles = {
    gold: {
      icon:
        "text-gold-300",
      bar:
        "bg-gold-400",
    },

    success: {
      icon:
        "text-emerald-300",
      bar:
        "bg-emerald-400",
    },

    danger: {
      icon:
        "text-red-300",
      bar:
        "bg-red-400",
    },
  };

  const style = styles[type];

  return (
    <div className="rounded-3xl border border-white/[0.07] bg-ink-900/40 p-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-cream-dim">
          {label}
        </span>

        <div className={style.icon}>
          {icon}
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div className="font-display text-4xl text-cream">
          {value}
        </div>

        <div className="text-sm text-cream-faint">
          {percentage.toFixed(1)}%
        </div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={`h-full rounded-full ${style.bar}`}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

/* =========================================================
   PROGRESS SECTION
========================================================= */

function ProgressSection({
  title,
  value,
  description,
  color,
}: {
  title: string;
  value: number;
  description: string;
  color:
    | "gold"
    | "success"
    | "danger"
    | "cream";
}) {
  const percentage = Math.min(
    Math.max(value, 0),
    100,
  );

  const colors = {
    gold: "bg-gold-400",

    success: "bg-emerald-400",

    danger: "bg-red-400",

    cream: "bg-cream",
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-medium text-cream">
            {title}
          </h3>

          <p className="mt-1 text-xs text-cream-faint">
            {description}
          </p>
        </div>

        <div className="font-display text-2xl text-cream">
          {percentage.toFixed(1)}%
        </div>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colors[color]}`}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

/* =========================================================
   FAMILY CARD
========================================================= */

function FamilyCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-gold-400/10 bg-white/[0.02] p-5">
      <div className="flex items-center justify-between text-gold-300">
        <span className="text-sm text-cream-dim">
          {label}
        </span>

        {icon}
      </div>

      <div className="mt-5 font-display text-3xl text-cream">
        {value.toLocaleString("fr-FR")}
      </div>
    </div>
  );
}

/* =========================================================
   PEOPLE STATUS CARD
========================================================= */

function PeopleStatusCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color:
    | "gold"
    | "success"
    | "danger";
}) {
  const colors = {
    gold:
      "border-gold-400/15 bg-gold-400/5 text-gold-300",

    success:
      "border-emerald-500/15 bg-emerald-500/5 text-emerald-300",

    danger:
      "border-red-500/15 bg-red-500/5 text-red-300",
  };

  return (
    <div
      className={`rounded-3xl border p-6 ${colors[color]}`}
    >
      <div className="flex items-center justify-between">
        <span className="max-w-[220px] text-sm text-cream-dim">
          {label}
        </span>

        {icon}
      </div>

      <div className="mt-6 font-display text-4xl text-cream">
        {value.toLocaleString("fr-FR")}
      </div>

      <p className="mt-2 text-xs text-cream-faint">
        Personne
        {value > 1 ? "s" : ""}
      </p>
    </div>
  );
}