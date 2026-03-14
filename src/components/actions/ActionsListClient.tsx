"use client";

import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import Link from "next/link";
import { ACTION_TYPE_COLORS, ACTION_TYPE_LABELS } from "@/constants/opportunityActions";
import type { OpportunityActionDTO } from "@/lib/dto/opportunity-action";
import type { OpportunityActionType } from "@prisma/client";
import { ActionDeleteButton } from "@/components/opportunities/ActionDeleteButton";
import opportunityActionService from "@/lib/services/front/opportunity-action.service";

export type ActionsListClientHandle = {
  addAction: (action: OpportunityActionDTO) => void;
  updateAction: (action: OpportunityActionDTO) => void;
};

const ACTION_TYPES: Array<{ value: OpportunityActionType; label: string }> = [
  { value: "INTERVIEW", label: "Entretien" },
  { value: "APPLIED", label: "Candidature" },
  { value: "INBOUND_CONTACT", label: "Contact entrant" },
  { value: "OUTBOUND_CONTACT", label: "Contact sortant" },
  { value: "MESSAGE", label: "Message" },
  { value: "CALL", label: "Appel" },
  { value: "FOLLOW_UP", label: "Relance" },
  { value: "OFFER_RECEIVED", label: "Offre reçue" },
  { value: "OFFER_ACCEPTED", label: "Offre acceptée" },
  { value: "REJECTED", label: "Refus" },
  { value: "NOTE", label: "Note" },
];

function dayKey(iso: string) {
  return iso.slice(0, 10); // YYYY-MM-DD
}

function formatDay(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (dayKey(date.toISOString()) === dayKey(today.toISOString())) return "Aujourd'hui";
  if (dayKey(date.toISOString()) === dayKey(yesterday.toISOString())) return "Hier";
  return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function groupByDay(actions: OpportunityActionDTO[]): Array<{ day: string; label: string; actions: OpportunityActionDTO[] }> {
  const map = new Map<string, OpportunityActionDTO[]>();
  for (const action of actions) {
    const key = dayKey(action.occurredAt);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(action);
  }
  return Array.from(map.entries()).map(([day, acts]) => ({
    day,
    label: formatDay(acts[0].occurredAt),
    actions: acts,
  }));
}

type Props = {
  initialType?: string;
  contactId?: string;
  onEdit?: (action: OpportunityActionDTO) => void;
};

export const ActionsListClient = forwardRef<ActionsListClientHandle, Props>(function ActionsListClient(
  { initialType, contactId, onEdit },
  ref
) {
  const [actions, setActions] = useState<OpportunityActionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>(initialType ?? "");

  useImperativeHandle(ref, () => ({
    addAction(action: OpportunityActionDTO) {
      setActions((prev) => [action, ...prev]);
    },
    updateAction(action: OpportunityActionDTO) {
      setActions((prev) => prev.map((a) => (a.id === action.id ? action : a)));
    },
  }));

  const loadActions = async () => {
    setLoading(true);
    try {
      const items = await opportunityActionService.listAll({
        type: typeFilter || undefined,
        contactId: contactId || undefined,
      });
      setActions(items);
    } catch {
      setActions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActions();
  }, [typeFilter, contactId]);

  const onDeleted = () => {
    loadActions();
  };

  const groups = groupByDay(actions);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Filtrer par type :</span>
        <select
          className="rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">Tous</option>
          {ACTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-neutral-500">Chargement…</div>
      ) : actions.length === 0 ? (
        <div className="py-8 text-center text-sm text-neutral-500">
          {contactId ? "Aucune action avec ce contact" : "Aucune action enregistrée"}
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.day}>
              {/* Séparateur de date */}
              <div className="mb-3 flex items-center gap-3">
                <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
                <span className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  {group.label}
                </span>
                <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
              </div>

              <div className="space-y-3">
                {group.actions.map((action) => (
                  <div
                    key={action.id}
                    className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded px-2 py-0.5 text-xs font-medium ${
                                ACTION_TYPE_COLORS[action.type] ?? ACTION_TYPE_COLORS.DEFAULT
                              }`}
                            >
                              {ACTION_TYPE_LABELS[action.type] ?? action.type}
                            </span>
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">
                              {new Date(action.occurredAt).toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {action.contact && (
                              <span className="text-xs text-neutral-600 dark:text-neutral-400">
                                Avec{" "}
                                <Link
                                  href={`/contacts/${action.contact.id}`}
                                  className="text-emerald-600 hover:underline dark:text-emerald-400"
                                >
                                  {action.contact.firstName} {action.contact.lastName}
                                  {action.contact.company ? ` (${action.contact.company.name})` : ""}
                                </Link>
                              </span>
                            )}
                            {action.workOpportunity && (
                              <Link
                                href={`/opportunities/${action.workOpportunity.id}`}
                                className="text-xs text-emerald-600 hover:underline dark:text-emerald-400"
                              >
                                {action.workOpportunity.title}
                              </Link>
                            )}
                            {action.company && !action.workOpportunity && (
                              <Link
                                href={`/companies/${action.company.id}`}
                                className="text-xs text-emerald-600 hover:underline dark:text-emerald-400"
                              >
                                {action.company.name}
                              </Link>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {onEdit && (
                              <button
                                type="button"
                                onClick={() => onEdit(action)}
                                className="text-xs text-neutral-600 hover:underline dark:text-neutral-400"
                              >
                                Modifier
                              </button>
                            )}
                            <ActionDeleteButton
                              actionId={action.id}
                              opportunityId={action.workOpportunityId ?? undefined}
                              onDeleted={onDeleted}
                            />
                          </div>
                        </div>

                        {action.notes && (
                          <p className="text-sm text-neutral-700 dark:text-neutral-300">{action.notes}</p>
                        )}

                        <div className="flex flex-wrap gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                          {action.contactChannel && (
                            <span className="flex items-center gap-1">
                              <span className="font-medium">Canal:</span>
                              <span>{action.contactChannel.value}</span>
                            </span>
                          )}
                          {action.participants && action.participants.length > 0 && (
                            <span>
                              <span className="font-medium">Participants:</span>{" "}
                              {action.participants
                                .map((p) => `${p.contact.firstName} ${p.contact.lastName}`)
                                .join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
