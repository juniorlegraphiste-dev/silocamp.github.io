import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  Baby,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Ticket,
  Trash2,
  UserRound,
  Users,
  X,
  XCircle,
} from "lucide-react";

import {
  cancelTicket,
  getTickets,
  type Ticket as TicketType,
  type TicketStatus,
} from "@/services/ticketService";

import { Reveal } from "@/components/Reveal";

import * as XLSX from "xlsx";

/* =========================================================
   TYPES
========================================================= */

type FilterStatus = "ALL" | TicketStatus;

/* =========================================================
   CONFIG PAGINATION
========================================================= */

const ITEMS_PER_PAGE = 10;

/* =========================================================
   PAGE
========================================================= */

export default function AdminTickets() {
  const [tickets, setTickets] = useState<TicketType[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<FilterStatus>("ALL");

  const [selectedTicket, setSelectedTicket] =
    useState<TicketType | null>(null);

  const [cancelling, setCancelling] = useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);

  /* =========================================================
     EXPORT CSV
  ========================================================= */

  function getExportRows() {
    return filteredTickets.map((ticket) => {
      const childrenUnder12 = Number(
        ticket.childrenUnder12 ?? 0,
      );

      const children12Plus = Number(
        ticket.children12Plus ?? 0,
      );

      const totalChildren =
        childrenUnder12 + children12Plus;

      return {
        Nom: ticket.lastName ?? "",
        Prénom: ticket.firstName ?? "",
        Participant: ticket.participantName,
        Email: ticket.email,
        Téléphone: ticket.phone ?? "",
        Réservation: ticket.reservationId ?? "",
        Billet: ticket.ticketNumber,
        Événement: ticket.eventTitle,
        Date: ticket.dateLabel,
        Heure: ticket.time,
        Places: ticket.quantity,
        "Enfants -12 ans": childrenUnder12,
        "Enfants 12+": children12Plus,
        "Total enfants": totalChildren,
        "Personnes attendues":
          1 + totalChildren,
        Statut: ticket.status,
        Inscription: formatDate(ticket.createdAt),
      };
    });
  }

  function exportCSV() {
    if (filteredTickets.length === 0) {
      window.alert("Aucun participant à exporter.");
      return;
    }

    const rows = getExportRows();

    const headers = Object.keys(rows[0]);

    const csv = [
      headers.join(";"),
      ...rows.map((row) =>
        headers
          .map((header) => {
            const value =
              row[header as keyof typeof row];

            return `"${String(value ?? "")
              .replace(/"/g, '""')}"`;
          })
          .join(";"),
      ),
    ].join("\n");

    const blob = new Blob(
      ["\uFEFF" + csv],
      {
        type: "text/csv;charset=utf-8;",
      },
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `silocamp-participants-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /* =========================================================
     EXPORT EXCEL
  ========================================================= */

  function exportExcel() {
    if (filteredTickets.length === 0) {
      window.alert("Aucun participant à exporter.");
      return;
    }

    const rows = getExportRows();

    const worksheet =
      XLSX.utils.json_to_sheet(rows);

    worksheet["!cols"] = [
      { wch: 18 },
      { wch: 18 },
      { wch: 25 },
      { wch: 32 },
      { wch: 18 },
      { wch: 24 },
      { wch: 24 },
      { wch: 32 },
      { wch: 24 },
      { wch: 12 },
      { wch: 10 },
      { wch: 16 },
      { wch: 14 },
      { wch: 15 },
      { wch: 20 },
      { wch: 14 },
      { wch: 24 },
    ];

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Participants",
    );

    XLSX.writeFile(
      workbook,
      `silocamp-participants-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`,
    );
  }

  /* =========================================================
     LOAD TICKETS
  ========================================================= */

  const loadTickets = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const data = await getTickets();

        setTickets(data);
      } catch (err) {
        console.error(
          "[SiloCamp Admin Tickets] Erreur :",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger les participants.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  /* =========================================================
     FILTERS
  ========================================================= */

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        ticket.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchableValues = [
        ticket.participantName,
        ticket.firstName ?? "",
        ticket.lastName ?? "",
        ticket.email,
        ticket.phone ?? "",
        ticket.ticketNumber,
        ticket.reservationId ?? "",
      ];

      return searchableValues.some((value) =>
        value.toLowerCase().includes(query),
      );
    });
  }, [tickets, search, statusFilter]);

  /* =========================================================
     PAGINATION
  ========================================================= */

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredTickets.length / ITEMS_PER_PAGE,
    ),
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages,
  );

  const startIndex =
    (safeCurrentPage - 1) * ITEMS_PER_PAGE;

  const endIndex =
    startIndex + ITEMS_PER_PAGE;

  const paginatedTickets =
    filteredTickets.slice(
      startIndex,
      endIndex,
    );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  /* =========================================================
     COUNTERS
  ========================================================= */

  const totalTickets = tickets.length;

  const validTickets = tickets.filter(
    (ticket) => ticket.status === "VALID",
  ).length;

  const usedTickets = tickets.filter(
    (ticket) => ticket.status === "USED",
  ).length;

  const cancelledTickets = tickets.filter(
    (ticket) => ticket.status === "CANCELLED",
  ).length;

  /* =========================================================
     CANCEL
  ========================================================= */

  async function handleCancel(ticket: TicketType) {
    if (ticket.status === "CANCELLED") {
      return;
    }

    const confirmed = window.confirm(
      `Voulez-vous vraiment annuler le billet ${ticket.ticketNumber} ?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancelling(true);

      const updatedTicket = await cancelTicket(
        ticket.ticketNumber,
      );

      setTickets((current) =>
        current.map((item) =>
          item.id === updatedTicket.id
            ? updatedTicket
            : item,
        ),
      );

      setSelectedTicket(updatedTicket);
    } catch (err) {
      console.error(
        "[SiloCamp Admin Tickets] Erreur annulation :",
        err,
      );

      window.alert(
        err instanceof Error
          ? err.message
          : "Impossible d'annuler le billet.",
      );
    } finally {
      setCancelling(false);
    }
  }

  /* =========================================================
     DELETE
  ========================================================= */

  async function handleDelete(ticket: TicketType) {
    const confirmed = window.confirm(
      `Voulez-vous définitivement supprimer le participant "${ticket.participantName}" ?\n\nCette action est irréversible.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(ticket.id);

      const apiBaseUrl = (
        import.meta.env.VITE_API_URL ||
        window.location.origin
      ).replace(/\/$/, "");

      const response = await fetch(
        `${apiBaseUrl}/api/tickets/${encodeURIComponent(
          ticket.ticketNumber,
        )}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const text = await response.text();

      let data: unknown = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        const message =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error?: unknown }).error ===
            "string"
            ? (data as { error: string }).error
            : "Impossible de supprimer le participant.";

        throw new Error(message);
      }

      setTickets((current) =>
        current.filter(
          (item) => item.id !== ticket.id,
        ),
      );

      if (
        selectedTicket &&
        selectedTicket.id === ticket.id
      ) {
        setSelectedTicket(null);
      }

      window.alert(
        "Participant supprimé avec succès.",
      );
    } catch (err) {
      console.error(
        "[SiloCamp Admin Tickets] Erreur suppression :",
        err,
      );

      window.alert(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer le participant.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-gold-300" />

          <p className="mt-4 text-sm text-cream-dim">
            Chargement des participants...
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center py-20">
        <div className="max-w-lg rounded-3xl border border-red-400/20 bg-red-400/5 p-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-400" />

          <h1 className="mt-5 font-display text-3xl text-cream">
            Impossible de charger les participants
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-cream-dim">
            {error}
          </p>

          <button
            type="button"
            onClick={() => void loadTickets()}
            className="btn-gold mt-6 inline-flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />

            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <Reveal>
        <div className="flex flex-col gap-6 border-b border-gold-400/10 pb-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gold-400/20 bg-gold-400/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-gold-300">
                <Users className="h-4 w-4" />

                Administration
              </div>

              <h1 className="mt-5 font-display text-4xl font-medium text-cream sm:text-5xl">
                Gestion des{" "}
                <span className="text-gold-gradient">
                  participants
                </span>
              </h1>

              <p className="mt-3 text-base text-cream-dim">
                Recherchez, consultez et gérez toutes les
                inscriptions.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadTickets(true)}
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

          {/* EXPORT */}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={exportCSV}
              disabled={filteredTickets.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-gold-400/20 px-4 py-2.5 text-sm font-medium text-gold-300 transition hover:bg-gold-400/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FileText className="h-4 w-4" />

              Exporter CSV

              <Download className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={exportExcel}
              disabled={filteredTickets.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-gold-400/20 px-4 py-2.5 text-sm font-medium text-gold-300 transition hover:bg-gold-400/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FileSpreadsheet className="h-4 w-4" />

              Exporter Excel

              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Reveal>

      {/* =====================================================
          COUNTERS
      ===================================================== */}

      <Reveal className="mt-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <CounterCard
            label="Total"
            value={totalTickets}
            icon={<Ticket className="h-5 w-5" />}
          />

          <CounterCard
            label="Valides"
            value={validTickets}
            icon={<CheckCircle2 className="h-5 w-5" />}
            success
          />

          <CounterCard
            label="Utilisés"
            value={usedTickets}
            icon={<UserRound className="h-5 w-5" />}
          />

          <CounterCard
            label="Annulés"
            value={cancelledTickets}
            icon={<XCircle className="h-5 w-5" />}
            danger
          />
        </div>
      </Reveal>

      {/* =====================================================
          SEARCH + FILTER
      ===================================================== */}

      <Reveal className="mt-8">
        <section className="rounded-3xl border border-gold-400/12 bg-ink-900/40 p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-xl">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cream-faint" />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Nom, email, téléphone ou numéro de billet..."
                className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] py-3 pl-12 pr-4 text-sm text-cream outline-none transition placeholder:text-cream-faint focus:border-gold-400/40"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <FilterButton
                active={statusFilter === "ALL"}
                onClick={() =>
                  setStatusFilter("ALL")
                }
              >
                Tous ({totalTickets})
              </FilterButton>

              <FilterButton
                active={statusFilter === "VALID"}
                onClick={() =>
                  setStatusFilter("VALID")
                }
              >
                Valides
              </FilterButton>

              <FilterButton
                active={statusFilter === "USED"}
                onClick={() =>
                  setStatusFilter("USED")
                }
              >
                Utilisés
              </FilterButton>

              <FilterButton
                active={
                  statusFilter === "CANCELLED"
                }
                onClick={() =>
                  setStatusFilter("CANCELLED")
                }
              >
                Annulés
              </FilterButton>
            </div>
          </div>

          <p className="mt-4 text-sm text-cream-faint">
            {filteredTickets.length} résultat
            {filteredTickets.length > 1 ? "s" : ""} trouvé
            {filteredTickets.length > 1 ? "s" : ""}.
          </p>
        </section>
      </Reveal>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <Reveal className="mt-8">
        <section className="overflow-hidden rounded-3xl border border-gold-400/12 bg-ink-900/40">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
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

                  <th className="px-6 py-4 text-right font-medium">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-16 text-center"
                    >
                      <Users className="mx-auto h-10 w-10 text-cream-faint" />

                      <p className="mt-4 text-sm text-cream-dim">
                        Aucun participant trouvé.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedTickets.map((ticket) => (
                    <TicketRow
                      key={ticket.id}
                      ticket={ticket}
                      deleting={
                        deletingId === ticket.id
                      }
                      onView={() =>
                        setSelectedTicket(ticket)
                      }
                      onDelete={() =>
                        void handleDelete(ticket)
                      }
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* =================================================
              PAGINATION
          ================================================= */}

          {filteredTickets.length > 0 && (
            <div className="flex flex-col gap-4 border-t border-white/[0.06] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-cream-faint">
                Affichage de{" "}
                <span className="text-cream">
                  {startIndex + 1}
                </span>{" "}
                à{" "}
                <span className="text-cream">
                  {Math.min(
                    endIndex,
                    filteredTickets.length,
                  )}
                </span>{" "}
                sur{" "}
                <span className="text-cream">
                  {filteredTickets.length}
                </span>{" "}
                participants
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.max(1, page - 1),
                    )
                  }
                  disabled={safeCurrentPage === 1}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gold-400/20 text-gold-300 transition hover:bg-gold-400/10 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Page précédente"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {getPaginationPages(
                  safeCurrentPage,
                  totalPages,
                ).map((page) =>
                  page === "..." ? (
                    <span
                      key={`${page}-${Math.random()}`}
                      className="flex h-10 w-8 items-center justify-center text-sm text-cream-faint"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      type="button"
                      onClick={() =>
                        setCurrentPage(page)
                      }
                      className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-medium transition ${
                        safeCurrentPage === page
                          ? "bg-gold-400 text-ink-950"
                          : "border border-gold-400/20 text-gold-300 hover:bg-gold-400/10"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(totalPages, page + 1),
                    )
                  }
                  disabled={
                    safeCurrentPage === totalPages
                  }
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gold-400/20 text-gold-300 transition hover:bg-gold-400/10 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Page suivante"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      </Reveal>

      {/* =====================================================
          MODAL
      ===================================================== */}

      {selectedTicket && (
        <TicketModal
          ticket={selectedTicket}
          cancelling={cancelling}
          onClose={() => setSelectedTicket(null)}
          onCancel={() =>
            void handleCancel(selectedTicket)
          }
        />
      )}
    </div>
  );
}

/* =========================================================
   TICKET ROW
========================================================= */

function TicketRow({
  ticket,
  deleting,
  onView,
  onDelete,
}: {
  ticket: TicketType;
  deleting: boolean;
  onView: () => void;
  onDelete: () => void;
}) {
  const childrenUnder12 = Number(
    ticket.childrenUnder12 ?? 0,
  );

  const children12Plus = Number(
    ticket.children12Plus ?? 0,
  );

  const totalChildren =
    childrenUnder12 + children12Plus;

  return (
    <tr className="border-b border-white/[0.05] transition hover:bg-white/[0.02]">
      <td className="px-6 py-5">
        <div className="font-medium text-cream">
          {ticket.participantName}
        </div>

        <div className="mt-1 text-xs text-cream-faint">
          {ticket.ticketNumber}
        </div>
      </td>

      <td className="px-6 py-5">
        <div className="flex items-center gap-2 text-sm text-cream-dim">
          <Mail className="h-3.5 w-3.5" />

          {ticket.email}
        </div>

        {ticket.phone && (
          <div className="mt-2 flex items-center gap-2 text-xs text-cream-faint">
            <Phone className="h-3.5 w-3.5" />

            {ticket.phone}
          </div>
        )}
      </td>

      <td className="px-6 py-5">
        <span className="font-semibold text-gold-300">
          {ticket.quantity}
        </span>

        <span className="ml-1 text-xs text-cream-faint">
          place
          {ticket.quantity > 1 ? "s" : ""}
        </span>
      </td>

      <td className="px-6 py-5">
        {totalChildren > 0 ? (
          <div className="flex items-center gap-2">
            <Baby className="h-4 w-4 text-gold-300" />

            <span className="text-sm text-cream">
              {totalChildren}
            </span>

            <span className="text-xs text-cream-faint">
              enfant
              {totalChildren > 1 ? "s" : ""}
            </span>
          </div>
        ) : (
          <span className="text-sm text-cream-faint">
            —
          </span>
        )}
      </td>

      <td className="px-6 py-5">
        <StatusBadge status={ticket.status} />
      </td>

      <td className="px-6 py-5 text-sm text-cream-faint">
        {formatDate(ticket.createdAt)}
      </td>

      <td className="px-6 py-5">
        <div className="flex justify-end gap-2">
          {/* VOIR */}

          <button
            type="button"
            onClick={onView}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gold-400/20 text-gold-300 transition hover:bg-gold-400/10"
            aria-label="Voir le participant"
            title="Voir"
          >
            <Eye className="h-4 w-4" />
          </button>

          {/* SUPPRIMER */}

          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gold-400/20 text-gold-300 transition hover:bg-gold-400/10 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Supprimer le participant"
            title="Supprimer"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}

/* =========================================================
   MODAL
========================================================= */

function TicketModal({
  ticket,
  cancelling,
  onClose,
  onCancel,
}: {
  ticket: TicketType;
  cancelling: boolean;
  onClose: () => void;
  onCancel: () => void;
}) {
  const childrenUnder12 = Number(
    ticket.childrenUnder12 ?? 0,
  );

  const children12Plus = Number(
    ticket.children12Plus ?? 0,
  );

  const totalChildren =
    childrenUnder12 + children12Plus;

  const totalPeople =
    1 + totalChildren;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-gold-400/20 bg-ink-900 shadow-2xl">
        <div className="flex items-start justify-between border-b border-gold-400/10 p-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-gold-300">
              <Ticket className="h-4 w-4" />

              Détails du billet
            </div>

            <h2 className="mt-3 font-display text-3xl text-cream">
              {ticket.participantName}
            </h2>

            <p className="mt-1 text-sm text-cream-faint">
              {ticket.ticketNumber}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] text-cream-dim transition hover:bg-white/[0.05]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-8 p-6">
          <section>
            <p className="text-xs uppercase tracking-wider text-cream-faint">
              Statut
            </p>

            <div className="mt-3">
              <StatusBadge status={ticket.status} />
            </div>
          </section>

          <section>
            <h3 className="font-display text-xl text-cream">
              Coordonnées
            </h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <InfoCard
                label="Email"
                value={ticket.email}
                icon={<Mail className="h-4 w-4" />}
              />

              <InfoCard
                label="Téléphone"
                value={
                  ticket.phone ||
                  "Non renseigné"
                }
                icon={<Phone className="h-4 w-4" />}
              />
            </div>
          </section>

          <section>
            <h3 className="font-display text-xl text-cream">
              Événement
            </h3>

            <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <p className="font-medium text-cream">
                {ticket.eventTitle}
              </p>

              <p className="mt-2 text-sm text-cream-dim">
                {ticket.dateLabel} • {ticket.time}
              </p>

              <p className="mt-1 text-sm text-cream-faint">
                {ticket.venue}, {ticket.city}
              </p>
            </div>
          </section>

          <section>
            <h3 className="font-display text-xl text-cream">
              Accompagnement familial
            </h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <InfoCard
                label="Moins de 12 ans"
                value={childrenUnder12}
                icon={<Baby className="h-4 w-4" />}
              />

              <InfoCard
                label="12 ans et plus"
                value={children12Plus}
                icon={<Users className="h-4 w-4" />}
              />

              <InfoCard
                label="Total enfants"
                value={totalChildren}
                icon={
                  <UserRound className="h-4 w-4" />
                }
              />
            </div>
          </section>

          <section>
            <h3 className="font-display text-xl text-cream">
              Réservation
            </h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <InfoCard
                label="Places consommées"
                value={ticket.quantity}
                icon={<Ticket className="h-4 w-4" />}
              />

              <InfoCard
                label="Personnes présentes"
                value={totalPeople}
                icon={<Users className="h-4 w-4" />}
              />
            </div>
          </section>

          {ticket.reservationId && (
            <section>
              <p className="text-xs uppercase tracking-wider text-cream-faint">
                Numéro de réservation
              </p>

              <div className="mt-2 break-all rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 font-mono text-sm text-gold-300">
                {ticket.reservationId}
              </div>
            </section>
          )}

          <section>
            <p className="text-xs uppercase tracking-wider text-cream-faint">
              Inscription
            </p>

            <p className="mt-2 text-sm text-cream-dim">
              {formatDate(ticket.createdAt)}
            </p>
          </section>

          {ticket.status !== "CANCELLED" && (
            <section className="border-t border-white/[0.06] pt-6">
              <button
                type="button"
                onClick={onCancel}
                disabled={cancelling}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
              >
                {cancelling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}

                Annuler ce billet
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   COUNTER CARD
========================================================= */

function CounterCard({
  label,
  value,
  icon,
  success,
  danger,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  success?: boolean;
  danger?: boolean;
}) {
  const colors = success
    ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
    : danger
      ? "border-red-500/20 bg-red-500/5 text-red-300"
      : "border-gold-400/15 bg-gold-400/5 text-gold-300";

  return (
    <div className={`rounded-2xl border p-5 ${colors}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-cream-dim">
          {label}
        </span>

        {icon}
      </div>

      <div className="mt-4 font-display text-3xl text-cream">
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   FILTER BUTTON
========================================================= */

function FilterButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm transition ${
        active
          ? "bg-gold-400 text-ink-950"
          : "border border-white/[0.08] text-cream-dim hover:bg-white/[0.04]"
      }`}
    >
      {children}
    </button>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status: TicketStatus;
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

/* =========================================================
   INFO CARD
========================================================= */

function InfoCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 text-xs text-cream-faint">
        {icon}

        {label}
      </div>

      <div className="mt-3 break-words font-medium text-cream">
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   PAGINATION HELPER
========================================================= */

function getPaginationPages(
  currentPage: number,
  totalPages: number,
): Array<number | "..."> {
  if (totalPages <= 7) {
    return Array.from(
      { length: totalPages },
      (_, index) => index + 1,
    );
  }

  if (currentPage <= 4) {
    return [
      1,
      2,
      3,
      4,
      5,
      "...",
      totalPages,
    ];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
}

/* =========================================================
   DATE
========================================================= */

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