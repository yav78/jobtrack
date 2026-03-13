"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { OpportunityForm } from "@/components/opportunities/OpportunityForm";
import { OpportunitiesTable } from "@/components/opportunities/OpportunitiesTable";
import { Pagination } from "@/components/common/Pagination";
import type { WorkOpportunityDTO } from "@/lib/dto/opportunity";
import opportunityService from "@/lib/services/front/opportunity.service";

const PAGE_SIZE = 20;

export default function OpportunitiesPage() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<WorkOpportunityDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadOpportunities = async (p: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await opportunityService.list(p, PAGE_SIZE);
      setOpportunities(data.items);
      setTotal(data.total);
      setPage(data.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des opportunités.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpportunities(1);
  }, []);

  const handleSuccess = async () => {
    await loadOpportunities(1);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Opportunités</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">Liste et création d&apos;opportunités.</p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
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
              <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={loadOpportunities} />
            </>
          )}
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold">Créer une opportunité</h2>
          <OpportunityForm onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
}
