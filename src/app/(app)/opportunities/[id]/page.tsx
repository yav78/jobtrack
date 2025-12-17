import Link from "next/link";
import { notFound } from "next/navigation";
import type { WorkOpportunityDTO } from "@/lib/dto/opportunity";
import type { EntretienDTO } from "@/lib/dto/entretien";
import { apiGet } from "@/lib/api";

type OpportunityDetail = WorkOpportunityDTO & {
  entretiens?: (EntretienDTO & { contactChannel?: { value: string }; contacts?: { contactId: string }[] })[];
};

async function fetchOpportunity(id: string): Promise<OpportunityDetail | null> {
  try {
    return await apiGet<OpportunityDetail>(`/api/opportunities/${id}`);
  } catch {
    return null;
  }
}

export default async function OpportunityDetailPage({ params }: { params: { id: string } }) {
  const opp = await fetchOpportunity(params.id);
  if (!opp) return notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{opp.title}</h1>
          {opp.description && <p className="text-sm text-neutral-600 dark:text-neutral-300">{opp.description}</p>}
        </div>
        <Link
          href="/entretiens/new"
          className="rounded bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700"
        >
          Nouvel entretien
        </Link>
      </div>

      <div className="card space-y-3">
        <h3 className="text-sm font-semibold">Entretiens</h3>
        <ul className="space-y-2 text-sm">
          {opp.entretiens?.length ? (
            opp.entretiens.map((e) => (
              <li key={e.id} className="rounded border border-neutral-200 p-2 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{new Date(e.date).toLocaleString()}</div>
                    <div className="text-neutral-600 dark:text-neutral-300">
                      Canal: {e.contactChannel?.value ?? "-"} · Contacts: {e.contacts?.length ?? 0}
                    </div>
                  </div>
                  <Link
                    href={`/entretiens/${e.id}`}
                    className="text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    Voir
                  </Link>
                </div>
              </li>
            ))
          ) : (
            <div className="text-neutral-500">Aucun entretien</div>
          )}
        </ul>
      </div>
    </div>
  );
}

