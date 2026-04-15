"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CompanyForm } from "@/components/companies/CompanyForm";
import { CompaniesTable } from "@/components/companies/CompaniesTable";
import { ExportButton } from "@/components/common/ExportButton";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Modal } from "@/components/common/Modal";
import type { CompanyDTO } from "@/lib/dto/company";
import { frontFetchJson } from "@/lib/services/front/abstract-crus.service";

type Props = {
  initialCompanies: CompanyDTO[];
};

export default function CompaniesPageClient({ initialCompanies }: Props) {
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyDTO[]>(initialCompanies);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    setCompanies(initialCompanies);
    setSelectedIds(new Set());
  }, [initialCompanies]);

  const handleBulkDelete = async () => {
    setConfirmOpen(false);
    try {
      setBulkLoading(true);
      setError(null);
      await frontFetchJson("/api/companies/bulk", {
        method: "POST",
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      router.refresh();
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
          <p className="text-sm text-neutral-600 dark:text-neutral-300">Liste des entreprises.</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton href="/api/export/companies" label="Exporter CSV" />
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Nouvelle entreprise
          </button>
        </div>
      </div>

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
        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}
        <CompaniesTable
          data={companies}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Créer une entreprise">
        <CompanyForm
          onSuccess={() => {
            setCreateOpen(false);
            router.refresh();
          }}
        />
      </Modal>

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
