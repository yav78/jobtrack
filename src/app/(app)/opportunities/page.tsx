"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { OpportunityForm } from "@/components/opportunities/OpportunityForm";
import { OpportunitiesTable } from "@/components/opportunities/OpportunitiesTable";
import { Pagination } from "@/components/common/Pagination";
import type { WorkOpportunityDTO } from "@/lib/dto/opportunity";
import opportunityService from "@/lib/services/front/opportunity.service";
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
    // search & statusFilter changes reset to page 1
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  const handleSuccess = async () => {
    await loadOpportunities(1, search, statusFilter);
    router.refresh();
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
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
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
                <OpportunitiesTable data={opportunities} />
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

        <div className="card">
          <h2 className="text-lg font-semibold">Créer une opportunité</h2>
          <OpportunityForm onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
}
