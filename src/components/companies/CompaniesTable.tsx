"use client";

import Link from "next/link";
import { DataTable } from "@/components/common/DataTable";
import type { CompanyDTO } from "@/lib/dto/company";

type Props = {
  data: CompanyDTO[];
};

export function CompaniesTable({ data }: Props) {
  return (
    <DataTable
      data={data}
      empty="Aucune entreprise"
      columns={[
        { header: "Nom", render: (row) => <Link href={`/companies/${row.id}`}>{row.name}</Link> },
        { header: "Type", render: (row) => row.typeCode ?? "-" },
        { header: "Site", render: (row) => row.website ?? "-" },
      ]}
    />
  );
}




