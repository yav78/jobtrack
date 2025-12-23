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

const ACTION_TYPE_LABELS: Record<string, string> = {
  INTERVIEW: "Entretien",
  APPLIED: "Candidature",
  INBOUND_CONTACT: "Contact entrant",
  OUTBOUND_CONTACT: "Contact sortant",
  MESSAGE: "Message",
  CALL: "Appel",
  FOLLOW_UP: "Relance",
  OFFER_RECEIVED: "Offre reçue",
  OFFER_ACCEPTED: "Offre acceptée",
  REJECTED: "Refus",
  NOTE: "Note",
};

const ACTION_TYPE_COLORS: Record<string, string> = {
  INTERVIEW: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  APPLIED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  INBOUND_CONTACT: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  OUTBOUND_CONTACT: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  MESSAGE: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  CALL: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  FOLLOW_UP: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  OFFER_RECEIVED: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  OFFER_ACCEPTED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  NOTE: "bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200",
};

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
                    ACTION_TYPE_COLORS[action.type] ?? ACTION_TYPE_COLORS.NOTE
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

