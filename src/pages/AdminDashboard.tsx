import { useCallback, useEffect, useState } from "react";

import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Ticket,
  Users,
  XCircle,
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

  if (loading) {
    return (
      <div className="container-px mx-auto flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-gold-300" />

          <p className="mt-4 text-sm text-cream-dim">
            Chargement des statistiques...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container-px mx-auto flex min-h-[70vh] items-center justify-center py-20">
        <div className="max-w-lg rounded-3xl border border-red-400/20 bg-red-400/5 p-8 text-center">
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

  const { stats, tickets } = data;

  const usagePercentage =
    stats.capacity > 0
      ? Math.min(
          100,
          Math.round((stats.reserved / stats.capacity) * 100),
        )
      : 0;

  const validTickets = tickets.filter(
    (ticket) => ticket.status === "VALID",
  );

  const usedTickets = tickets.filter(
    (ticket) => ticket.status === "USED",
  );

  const cancelledTickets = tickets.filter(
    (ticket) => ticket.status === "CANCELLED",
  );

  return (
    <div className="container-px mx-auto max-w-7xl pb-24 pt-28 md:pt-32">
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
              Suivez les inscriptions et la disponibilité en temps réel.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadDashboard(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-gold-400/30 px-5 py-3 text-sm font-medium text-gold-300 transition hover:bg-gold-400/10 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />

            Actualiser
          </button>
        </div>
      </Reveal>

      {/* =====================================================
          STATISTIQUES
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
            value={stats.reserved}
            description="Places réellement utilisées"
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
            description={`${stats.reserved} / ${stats.capacity} places`}
            icon={<BarChart3 className="h-6 w-6" />}
          />
        </div>
      </Reveal>

      {/* =====================================================
          ÉTATS DES BILLETS
      ===================================================== */}

      <Reveal className="mt-8">
        <div className="grid gap-5 md:grid-cols-3">
          <StatusCard
            title="Billets valides"
            value={stats.validTickets ?? validTickets.length}
            icon={<Ticket className="h-6 w-6" />}
            description="Participants inscrits"
          />

          <StatusCard
            title="Billets utilisés"
            value={stats.usedTickets ?? usedTickets.length}
            icon={<CheckCircle2 className="h-6 w-6" />}
            description="Participants entrés"
            success
          />

          <StatusCard
            title="Billets annulés"
            value={stats.cancelledTickets ?? cancelledTickets.length}
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
                {stats.reserved} places consommées sur{" "}
                {stats.capacity}.
              </p>
            </div>

            <div className="text-right">
              <div className="font-display text-3xl text-gold-300">
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

            <span>{stats.capacity} places</span>
          </div>
        </section>
      </Reveal>

      {/* =====================================================
          LISTE DES PARTICIPANTS
      ===================================================== */}

      <Reveal className="mt-10">
        <section className="overflow-hidden rounded-3xl border border-gold-400/12 bg-ink-900/40">
          <div className="flex flex-col gap-4 border-b border-gold-400/10 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl text-cream">
                Participants
              </h2>

              <p className="mt-1 text-sm text-cream-dim">
                {tickets.length} inscription
                {tickets.length > 1 ? "s" : ""} enregistrée
                {tickets.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
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
                    Enfants
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
                {tickets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-sm text-cream-faint"
                    >
                      Aucun participant enregistré.
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => {
                    const childrenTotal =
                      Number(ticket.childrenUnder12 ?? 0) +
                      Number(ticket.children12Plus ?? 0);

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

                        <td className="px-6 py-4 text-sm text-cream-dim">
                          {childrenTotal}
                        </td>

                        <td className="px-6 py-4">
                          <StatusBadge status={ticket.status} />
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
      <div className="flex items-start justify-between">
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
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
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
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
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