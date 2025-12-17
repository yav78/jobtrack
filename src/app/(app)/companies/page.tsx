import { CompanyForm } from "@/components/companies/CompanyForm";
import { CompaniesTable } from "@/components/companies/CompaniesTable";
import type { CompanyDTO } from "@/lib/dto/company";
import { absoluteUrl } from "@/lib/api";

async function fetchCompanies() {
  const res = await fetch(absoluteUrl("/api/companies"), {
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
          <CompaniesTable data={companies} />
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold">Créer une entreprise</h2>
          <CompanyForm />
        </div>
      </div>
    </div>
  );
}

