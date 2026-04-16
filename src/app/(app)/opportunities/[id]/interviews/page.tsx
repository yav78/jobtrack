import Link from "next/link";
import { notFound } from "next/navigation";
import { OpportunityActionsSection } from "@/components/opportunities/OpportunityActionsSection";
import opportunityService from "@/lib/services/front/opportunity.service";

// Désactiver le cache pour cette page dynamique
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OpportunityInterviewsPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const opp = await opportunityService.detail(resolvedParams.id);
  if (!opp) return notFound();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Entretiens - {opp.title}</h1>
        <Link
          href={`/opportunities/${resolvedParams.id}`}
          className="text-sm text-emerald-600 hover:underline dark:text-emerald-400"
        >
          ← Retour à l&apos;opportunité
        </Link>
      </div>

      <div className="card space-y-4">
        <h3 className="text-sm font-semibold">Entretiens</h3>
        <OpportunityActionsSection
          opportunityId={resolvedParams.id}
          companyId={opp.companyId}
          initialType="INTERVIEW"
          hideTypeFilter
          emptyMessage="Aucun entretien enregistré"
        />
      </div>
    </div>
  );
}
