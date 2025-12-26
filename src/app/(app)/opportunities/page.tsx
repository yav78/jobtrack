"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { OpportunityForm } from "@/components/opportunities/OpportunityForm";
import { OpportunitiesTable } from "@/components/opportunities/OpportunitiesTable";
import type { WorkOpportunityDTO } from "@/lib/dto/opportunity";
import opportunityService from "@/lib/services/front/opportunity.service";

export default function OpportunitiesPage() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<WorkOpportunityDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await opportunityService.list();
      setOpportunities(data);
      setLoading(false);
    };
    load();
  }, []);

  const handleSuccess = async () => {
    // Recharger la liste après création
    const data = await opportunityService.list();
    setOpportunities(data);
    router.refresh();
  };

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
          {loading ? (
            <div className="py-4 text-center text-sm text-neutral-500">Chargement...</div>
          ) : (
            <OpportunitiesTable data={opportunities} />
          )}
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold">Créer une opportunité</h2>
          <OpportunityForm onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
}
