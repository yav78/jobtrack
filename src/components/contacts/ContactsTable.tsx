"use client";

import Link from "next/link";
import { DataTable } from "@/components/common/DataTable";

type ContactRow = {
  id: string;
  firstName: string;
  lastName: string;
  companyId?: string;
  company?: {
    id: string;
    name: string;
  };
};

type Props = {
  data: ContactRow[];
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
};

export function ContactsTable({ data, selectable, selectedIds, onSelectionChange }: Props) {
  return (
    <DataTable
      data={data}
      empty="Aucun contact. Utilisez le formulaire à droite pour en créer un."
      selectable={selectable}
      selectedIds={selectedIds}
      onSelectionChange={onSelectionChange}
      columns={[
        {
          header: "Nom",
          render: (row) => (
            <Link href={`/contacts/${row.id}`}>
              {row.firstName} {row.lastName}
            </Link>
          ),
        },
        {
          header: "Entreprise",
          render: (row) => (
            <Link href={`/companies/${row.company?.id}`}>{row.company?.name || "—"}</Link>
          ),
        },
      ]}
    />
  );
}
