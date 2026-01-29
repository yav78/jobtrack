import { ACTION_TYPE_COLORS, ACTION_TYPE_LABELS } from "@/constants/opportunityActions";
import type { OpportunityActionDTO } from "@/lib/dto/opportunity-action";
import { getOpportunityActions } from "@/lib/services/back/opportunity-actions";
import { getChannelTypes } from "@/lib/services/back/channel-types";
import { requireUserId } from "@/lib/api-helpers";
import { ActionDeleteButton } from "./ActionDeleteButton";
import type { OpportunityActionType } from "@prisma/client";

type Props = {
  opportunityId: string;
  type?: string;
};

export async function OpportunityTimeline({ opportunityId, type }: Props) {
  const userId = await requireUserId();
  const [actionsData, channelTypes] = await Promise.all([
    getOpportunityActions(
      opportunityId,
      userId,
      type ? { type: type as OpportunityActionType } : undefined
    ),
    getChannelTypes(),
  ]);

  // Créer un map pour accéder rapidement aux labels des types de canaux
  const channelTypeMap = new Map(channelTypes.map((ct) => [ct.code, ct.label]));

  // Transformer en DTO
  const actions: OpportunityActionDTO[] = actionsData.map((action) => ({
    id: action.id,
    occurredAt: action.occurredAt.toISOString(),
    type: action.type,
    notes: action.notes,
    metadata: action.metadata as Record<string, unknown> | null,
    channelTypeCode: (action as typeof action & { channelTypeCode: string | null }).channelTypeCode ?? null,
    userId: action.userId,
    workOpportunityId: action.workOpportunityId,
    contactChannelId: action.contactChannelId,
    createdAt: action.createdAt.toISOString(),
    updatedAt: action.updatedAt.toISOString(),
    contactChannel: action.contactChannel
      ? {
          id: action.contactChannel.id,
          value: action.contactChannel.value,
          label: action.contactChannel.label,
        }
      : undefined,
    participants: action.participants.map((p) => ({
      contactId: p.contactId,
      contact: {
        id: p.contact.id,
        firstName: p.contact.firstName,
        lastName: p.contact.lastName,
      },
    })),
  }));

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
              <div className="flex items-center justify-between">
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
                <ActionDeleteButton actionId={action.id} opportunityId={opportunityId} />
              </div>

              {action.notes && (
                <p className="text-sm text-neutral-700 dark:text-neutral-300">{action.notes}</p>
              )}

              <div className="flex flex-wrap gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                {/* Afficher le canal de communication */}
                {action.contactChannel ? (
                  <span className="flex items-center gap-1">
                    <span className="font-medium">Canal:</span>
                    <span>{action.contactChannel.value}</span>
                    {action.contactChannel.label && (
                      <span className="text-neutral-500 dark:text-neutral-500">
                        ({action.contactChannel.label})
                      </span>
                    )}
                  </span>
                ) : action.channelTypeCode ? (
                  <span className="flex items-center gap-1">
                    <span className="font-medium">Canal:</span>
                    <span>{channelTypeMap.get(action.channelTypeCode) || action.channelTypeCode}</span>
                  </span>
                ) : null}
                {action.participants && action.participants.length > 0 && (
                  <span>
                    <span className="font-medium">Participants:</span>{" "}
                    {action.participants.map((p) => `${p.contact.firstName} ${p.contact.lastName}`).join(", ")}
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
