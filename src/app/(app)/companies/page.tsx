"use client";

import { useEffect, useState } from "react";
import { CompanyForm } from "@/components/companies/CompanyForm";
import { CompaniesTable } from "@/components/companies/CompaniesTable";
import { ExportButton } from "@/components/common/ExportButton";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import type { CompanyDTO } from "@/lib/dto/company";
import companyService from "@/lib/services/front/company.service";
import { frontFetchJson } from "@/lib/services/front/abstract-crus.service";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await companyService.list();
      setCompanies(items);
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des entreprises.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleBulkDelete = async () => {
    setConfirmOpen(false);
    try {
      setBulkLoading(true);
      await frontFetchJson("/api/companies/bulk", {
        method: "POST",
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      await load();
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
          <h1 className="text-2xl font-semibold">Entreprises</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">Liste et création d&apos;entreprises.</p>
        </div>
        <ExportButton href="/api/export/companies" label="Exporter CSV" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="card space-y-3">
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
            <CompaniesTable
              data={companies}
              selectable
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
          )}
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold">Créer une entreprise</h2>
          <CompanyForm onSuccess={() => load()} />
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={`Supprimer ${selectedIds.size} entreprise(s) ?`}
        description="Les contacts associés seront également supprimés. Cette action est réversible depuis la corbeille."
        confirmLabel="Supprimer"
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
