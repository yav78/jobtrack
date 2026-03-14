import { notFound } from "next/navigation";
import { OpportunityTimeline } from "@/components/opportunities/OpportunityTimeline";
import { ActionPageClient } from "@/components/opportunities/ActionPageClient";
import { ActionTypeFilterClient } from "@/components/opportunities/ActionTypeFilterClient";
import { OpportunityEditClient } from "@/components/opportunities/OpportunityEditClient";
import { OpportunityEmailButton } from "@/components/opportunities/OpportunityEmailButton";
import { getOpportunity } from "@/lib/services/back/opportunities";
import { requireUserId } from "@/lib/api-helpers";

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
  const userId = await requireUserId();
  // Forcer le re-fetch sans cache
  const opp = await getOpportunity(resolvedParams.id, userId);
  if (!opp) return notFound();
  
  // Vérifier que l'ID correspond bien
  if (opp.id !== resolvedParams.id) {
    console.error(`ID mismatch: expected ${resolvedParams.id}, got ${opp.id}`);
    return notFound();
  }

  const type = resolvedSearchParams?.type;

  // Transformer l'opportunité en DTO pour le composant client
  const opportunityDTO = {
    id: opp.id,
    title: opp.title,
    description: opp.description,
    status: opp.status,
    followUpAt: opp.followUpAt?.toISOString() ?? null,
    companyId: opp.companyId,
    userId: opp.userId,
    createdAt: opp.createdAt.toISOString(),
    updatedAt: opp.updatedAt.toISOString(),
    company: opp.company
      ? {
          id: opp.company.id,
          name: opp.company.name,
        }
      : null,
  };

  return (
    <div className="space-y-4">
      <OpportunityEditClient opportunity={opportunityDTO} />

      <div className="flex justify-end">
        <OpportunityEmailButton
          opportunityTitle={opp.title}
          companyName={opp.company?.name}
        />
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
