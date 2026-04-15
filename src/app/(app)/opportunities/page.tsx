"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { OpportunityForm } from "@/components/opportunities/OpportunityForm";
import { OpportunitiesTable } from "@/components/opportunities/OpportunitiesTable";
import { Pagination } from "@/components/common/Pagination";
import { ExportButton } from "@/components/common/ExportButton";
import { Modal } from "@/components/common/Modal";
import type { WorkOpportunityDTO } from "@/lib/dto/opportunity";
import opportunityService from "@/lib/services/front/opportunity.service";
import { frontFetchJson } from "@/lib/services/front/abstract-crus.service";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  OPPORTUNITY_STATUS_LABELS,
  OPPORTUNITY_STATUS_COLORS,
  OPPORTUNITY_STATUS_ORDER,
} from "@/constants/opportunityStatus";

const PAGE_SIZE = 20;

const ALL_STATUSES = [{ value: "", label: "Tous" }].concat(
  OPPORTUNITY_STATUS_ORDER.map((s) => ({ value: s, label: OPPORTUNITY_STATUS_LABELS[s] }))
);

export default function OpportunitiesPage() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<WorkOpportunityDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const loadOpportunities = useCallback(
    async (p: number, q: string, status: string) => {
      try {
        setLoading(true);
        setError(null);
        const data = await opportunityService.list(p, PAGE_SIZE, {
          q: q || undefined,
          status: status || undefined,
        });
        setOpportunities(data.items);
        setTotal(data.total);
        setPage(data.page);
        setSelectedIds(new Set());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors du chargement des opportunités.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadOpportunities(1, search, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  const handleSuccess = async () => {
    setCreateOpen(false);
    await loadOpportunities(1, search, statusFilter);
    router.refresh();
  };

  const handleBulkDelete = async () => {
    setConfirmOpen(false);
    try {
      setBulkLoading(true);
      await frontFetchJson("/api/opportunities/bulk", {
        method: "POST",
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      await loadOpportunities(page, search, statusFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression.");
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Opportunités</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Liste et création d&apos;opportunités.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton href="/api/export/opportunities" label="Exporter CSV" />
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Nouvelle opportunité
          </button>
        </div>
      </div>

      <div>
        <div className="space-y-4">
          {/* Recherche + filtres */}
          <div className="card space-y-3">
            <input
              type="search"
              placeholder="Rechercher par titre…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
            <div className="flex flex-wrap gap-1">
              {ALL_STATUSES.map(({ value, label }) => {
                const active = statusFilter === value;
                const color = value
                  ? OPPORTUNITY_STATUS_COLORS[value]
                  : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatusFilter(value)}
                    className={`rounded px-2 py-1 text-xs font-medium transition-opacity ${color} ${
                      active ? "ring-2 ring-offset-1 ring-current" : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sélection + bulk actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {selectedIds.size} sélectionné(s)
              </span>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={bulkLoading}
                className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                Supprimer la sélection
              </button>
            </div>
          )}

          {/* Résultats */}
          <div className="card">
            {loading ? (
              <div className="space-y-2 animate-pulse">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 rounded bg-neutral-200 dark:bg-neutral-700" />
                ))}
              </div>
            ) : error ? (
              <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                {error}
              </div>
            ) : (
              <>
                <OpportunitiesTable
                  data={opportunities}
                  selectable
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
                />
                <Pagination
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={total}
                  onPageChange={(p) => loadOpportunities(p, search, statusFilter)}
                />
              </>
            )}
          </div>
        </div>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nouvelle opportunité">
        <OpportunityForm onSuccess={handleSuccess} />
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title={`Supprimer ${selectedIds.size} opportunité(s) ?`}
        description="Cette action est réversible depuis la corbeille."
        confirmLabel="Supprimer"
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
