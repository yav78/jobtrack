import Link from "next/link";
import { OpportunityForm } from "@/components/opportunities/OpportunityForm";
import { DataTable } from "@/components/common/DataTable";
import type { WorkOpportunityDTO } from "@/lib/dto/opportunity";
import { apiGet } from "@/lib/api";

async function fetchOpportunities(): Promise<WorkOpportunityDTO[]> {
  try {
    const data = await apiGet<{ items: WorkOpportunityDTO[] }>("/api/opportunities");
    return data.items ?? [];
  } catch {
    return [];
  }
}

export default async function OpportunitiesPage() {
  const opportunities = await fetchOpportunities();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Opportunités</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">Liste et création d&apos;opportunités.</p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="card">
          <DataTable
            data={opportunities}
            empty="Aucune opportunité"
            columns={[
              { header: "Titre", render: (row: WorkOpportunityDTO) => <Link href={`/opportunities/${row.id}`}>{row.title}</Link> },
              { header: "Description", render: (row: WorkOpportunityDTO) => row.description ?? "-" },
            ]}
          />
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold">Créer une opportunité</h2>
          <OpportunityForm />
        </div>
      </div>
    </div>
  );
}

