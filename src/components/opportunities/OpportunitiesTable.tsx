"use client";

import { useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/common/DataTable";
import { SourceModal } from "@/components/opportunities/SourceModal";
import type { WorkOpportunityDTO } from "@/lib/dto/opportunity";
import {
  OPPORTUNITY_STATUS_LABELS,
  OPPORTUNITY_STATUS_COLORS,
} from "@/constants/opportunityStatus";

type Props = {
  data: WorkOpportunityDTO[];
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
};

function StatusBadge({ status }: { status: string }) {
  const label = OPPORTUNITY_STATUS_LABELS[status] ?? status;
  const color =
    OPPORTUNITY_STATUS_COLORS[status] ??
    "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

function FollowUpCell({ followUpAt }: { followUpAt?: string | null }) {
  if (!followUpAt) return <span className="text-neutral-400">—</span>;
  const date = new Date(followUpAt);
  const isOverdue = date < new Date();
  const formatted = date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return (
    <span
      className={
        isOverdue
          ? "font-medium text-red-600 dark:text-red-400"
          : "text-neutral-700 dark:text-neutral-300"
      }
      title={isOverdue ? "Rappel en retard" : undefined}
    >
      {isOverdue ? "⚠ " : ""}
      {formatted}
    </span>
  );
}

export function OpportunitiesTable({ data, selectable, selectedIds, onSelectionChange }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  return (
    <>
    <DataTable
      data={data}
      empty="Aucune opportunité. Cliquez sur « Nouvelle opportunité » pour en créer une."
      selectable={selectable}
      selectedIds={selectedIds}
      onSelectionChange={onSelectionChange}
      columns={[
        {
          header: "Titre",
          render: (row) => (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Link href={`/opportunities/${row.id}`} className="hover:underline">
                  {row.title}
                </Link>
                {row.sourceUrl && (
                  <button
                    type="button"
                    title="Aperçu de la source"
                    aria-label="Aperçu de la source"
                    onClick={() => setPreviewUrl(row.sourceUrl ?? null)}
                    className="text-neutral-400 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-3.5 w-3.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z"
                        clipRule="evenodd"
                      />
                      <path
                        fillRule="evenodd"
                        d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </div>
              {row.sourceLink && (
                <span className="inline-block rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                  Vu sur : {row.sourceLink.title}
                </span>
              )}
            </div>
          ),
        },
        {
          header: "Statut",
          render: (row) => <StatusBadge status={row.status} />,
        },
        {
          header: "Entreprise",
          render: (row) =>
            row.company ? (
              <Link href={`/companies/${row.company.id}`} className="text-emerald-600 hover:underline">
                {row.company.name}
              </Link>
            ) : (
              <span className="text-neutral-400">—</span>
            ),
        },
        {
          header: "Relance",
          render: (row) => <FollowUpCell followUpAt={row.followUpAt} />,
        },
        {
          header: "Ajouté le",
          render: (row) => (
            <span className="text-neutral-500 dark:text-neutral-400 text-xs">
              {new Date(row.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          ),
        },
      ]}
    />
    {previewUrl && (
      <SourceModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
    )}
    </>
  );
}
