"use client";

import Link from "next/link";
import { DataTable } from "@/components/common/DataTable";
import type { CompanyDTO } from "@/lib/dto/company";
import { useCompanyTypes } from "@/hooks/useCompanyTypes";

type Props = {
  data: CompanyDTO[];
};

export function CompaniesTable({ data }: Props) {
  const { getLabel } = useCompanyTypes();

  return (
    <DataTable
      data={data}
      empty="Aucune entreprise. Utilisez le formulaire à droite pour en créer une."
      columns={[
        { header: "Nom", render: (row) => <Link href={`/companies/${row.id}`}>{row.name}</Link> },
        { header: "Type", render: (row) => getLabel(row.typeCode) },
        { header: "Site", render: (row) => row.website ?? "-" },
      ]}
    />
  );
}




