"use client";

import Link from "next/link";
import { DataTable } from "@/components/common/DataTable";
import type { WorkOpportunityDTO } from "@/lib/dto/opportunity";

type Props = {
  data: WorkOpportunityDTO[];
};

export function OpportunitiesTable({ data }: Props) {
  return (
    <DataTable
      data={data}
      empty="Aucune opportunité"
      columns={[
        { header: "Titre", render: (row) => <Link href={`/opportunities/${row.id}`}>{row.title}</Link> },
        { header: "Description", render: (row) => row.description ?? "-" },
      ]}
    />
  );
}

