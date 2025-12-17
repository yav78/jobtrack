import { OpportunityForm } from "@/components/opportunities/OpportunityForm";
import { OpportunitiesTable } from "@/components/opportunities/OpportunitiesTable";
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
          <OpportunitiesTable data={opportunities} />
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold">Créer une opportunité</h2>
          <OpportunityForm />
        </div>
      </div>
    </div>
  );
}

