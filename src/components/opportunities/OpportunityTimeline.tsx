import { ACTION_TYPE_COLORS, ACTION_TYPE_LABELS } from "@/constants/opportunityActions";
import type { OpportunityActionDTO } from "@/lib/dto/opportunity-action";
import { absoluteUrl } from "@/lib/api";

type Props = {
  opportunityId: string;
  type?: string;
};

async function fetchActions(opportunityId: string, type?: string): Promise<OpportunityActionDTO[]> {
  try {
    const url = new URL(absoluteUrl(`/api/opportunities/${opportunityId}/actions`));
    if (type) {
      url.searchParams.set("type", type);
    }
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

export async function OpportunityTimeline({ opportunityId, type }: Props) {
  const actions = await fetchActions(opportunityId, type);

  if (actions.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-neutral-500">
        Aucune action enregistrée
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {actions.map((action) => (
        <div
          key={action.id}
          className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    ACTION_TYPE_COLORS[action.type] ?? ACTION_TYPE_COLORS.DEFAULT
                  }`}
                >
                  {ACTION_TYPE_LABELS[action.type] ?? action.type}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {new Date(action.occurredAt).toLocaleString("fr-FR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              </div>

              {action.notes && (
                <p className="text-sm text-neutral-700 dark:text-neutral-300">{action.notes}</p>
              )}

              <div className="flex flex-wrap gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                {action.contactChannel && (
                  <span>Canal: {action.contactChannel.value}</span>
                )}
                {action.participants && action.participants.length > 0 && (
                  <span>
                    Participants: {action.participants.map((p) => `${p.contact.firstName} ${p.contact.lastName}`).join(", ")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
