import Link from "next/link";
import { notFound } from "next/navigation";
import type { WorkOpportunityDTO } from "@/lib/dto/opportunity";
import { OpportunityTimeline } from "@/components/opportunities/OpportunityTimeline";
import { ActionPageClient } from "@/components/opportunities/ActionPageClient";
import { ActionTypeFilterClient } from "@/components/opportunities/ActionTypeFilterClient";
import opportunityService from "@/lib/services/front/opportunity.service";

// Désactiver le cache pour cette page dynamique
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OpportunityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }> | { id: string };
  searchParams?: Promise<{ type?: string }> | { type?: string };
}) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const resolvedSearchParams = searchParams instanceof Promise ? await searchParams : searchParams;
  
  if (!resolvedParams?.id) {
    return notFound();
  }
  
  // Forcer le re-fetch sans cache
  const opp = await opportunityService.detail(resolvedParams.id);
  if (!opp) return notFound();
  
  // Vérifier que l'ID correspond bien
  if (opp.id !== resolvedParams.id) {
    console.error(`ID mismatch: expected ${resolvedParams.id}, got ${opp.id}`);
    return notFound();
  }

  const type = resolvedSearchParams?.type;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{opp.title}</h1>
          {opp.description && <p className="text-sm text-neutral-600 dark:text-neutral-300">{opp.description}</p>}
          {opp.company && (
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Entreprise: <Link href={`/companies/${opp.company.id}`} className="text-emerald-600 hover:underline dark:text-emerald-400">{opp.company.name}</Link>
            </p>
          )}
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Timeline des actions</h3>
          <ActionPageClient opportunityId={resolvedParams.id} companyId={opp.companyId} />
        </div>

        <ActionTypeFilterClient opportunityId={resolvedParams.id} />

        <OpportunityTimeline opportunityId={resolvedParams.id} type={type} />
      </div>
    </div>
  );
}
