"use client";

import Link from "next/link";
import { DataTable } from "@/components/common/DataTable";

type ContactRow = {
  id: string;
  firstName: string;
  lastName: string;
  companyId?: string;
};

type Props = {
  data: ContactRow[];
};

export function ContactsTable({ data }: Props) {
  return (
    <DataTable
      data={data}
      empty="Aucun contact"
      columns={[
        {
          header: "Nom",
          render: (row) => (
            <Link href={`/contacts/${row.id}`}>
              {row.firstName} {row.lastName}
            </Link>
          ),
        },
        { header: "Entreprise", render: () => "—" },
      ]}
    />
  );
}




