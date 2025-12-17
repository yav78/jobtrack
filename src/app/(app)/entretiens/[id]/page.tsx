import { notFound } from "next/navigation";
import { apiGet } from "@/lib/api";
import type { EntretienDTO } from "@/lib/dto/entretien";

type EntretienDetail = EntretienDTO & {
  contactChannel?: { value: string };
  workOpportunity?: { title: string };
};

async function fetchEntretien(id: string): Promise<EntretienDetail | null> {
  try {
    return await apiGet<EntretienDetail>(`/api/entretiens/${id}`);
  } catch {
    return null;
  }
}

export default async function EntretienDetailPage({ params }: { params: { id: string } }) {
  const entretien = await fetchEntretien(params.id);
  if (!entretien) return notFound();

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Entretien</h1>
      <div className="card space-y-2">
        <div className="text-sm text-neutral-600 dark:text-neutral-300">
          Date : {new Date(entretien.date).toLocaleString()}
        </div>
        <div className="text-sm text-neutral-600 dark:text-neutral-300">
          Opportunité : {entretien.workOpportunity?.title ?? "-"}
        </div>
        <div className="text-sm text-neutral-600 dark:text-neutral-300">
          Canal : {entretien.contactChannel?.value ?? "-"}
        </div>
      </div>
    </div>
  );
}

