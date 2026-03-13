"use client";

import Link from "next/link";
import { DataTable } from "@/components/common/DataTable";
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
  return (
    <DataTable
      data={data}
      empty="Aucune opportunité. Utilisez le formulaire à droite pour en créer une."
      selectable={selectable}
      selectedIds={selectedIds}
      onSelectionChange={onSelectionChange}
      columns={[
        {
          header: "Titre",
          render: (row) => (
            <Link href={`/opportunities/${row.id}`} className="hover:underline">
              {row.title}
            </Link>
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
      ]}
    />
  );
}
