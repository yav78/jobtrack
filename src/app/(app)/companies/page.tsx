import Link from "next/link";
import { CompanyForm } from "@/components/companies/CompanyForm";
import { DataTable } from "@/components/common/DataTable";
import type { CompanyDTO } from "@/lib/dto/company";

async function fetchCompanies() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/companies`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.items ?? [];
}

export default async function CompaniesPage() {
  const companies: CompanyDTO[] = await fetchCompanies();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Entreprises</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">Liste et création d&apos;entreprises.</p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="card">
          <DataTable
            data={companies}
            empty="Aucune entreprise"
            columns={[
              { header: "Nom", render: (row: CompanyDTO) => <Link href={`/companies/${row.id}`}>{row.name}</Link> },
              { header: "Type", render: (row: CompanyDTO) => row.typeCode ?? "-" },
              { header: "Site", render: (row: CompanyDTO) => row.website ?? "-" },
            ]}
          />
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold">Créer une entreprise</h2>
          <CompanyForm />
        </div>
      </div>
    </div>
  );
}

