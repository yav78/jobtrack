import { ACTION_TYPE_COLORS, ACTION_TYPE_LABELS, ACTION_TYPE_ORDER } from "@/constants/opportunityActions";
import type { OpportunityActionDTO } from "@/lib/dto/opportunity-action";
import type { OpportunityActionType } from "@prisma/client";
import { getDashboardOverview, type DashboardResponse } from "@/lib/services/front/dashboard.service";

const EMPTY_STATS: DashboardResponse["stats"] = {
  companies: 0,
  contacts: 0,
  opportunities: 0,
  entretiens: 0,
  actionsTotal: 0,
  actionsLast30Days: 0,
  actionsByType: [],
};

async function fetchDashboard(): Promise<DashboardResponse> {
  try {
    return await getDashboardOverview();
  } catch (error) {
    console.error("Error loading dashboard:", error);
    return { stats: EMPTY_STATS, recentActions: [] };
  }
}

export const dynamic = "force-dynamic";

export default async function Home() {
  const { stats, recentActions } = await fetchDashboard();
  const actionTypeCounts = new Map(stats.actionsByType.map((entry) => [entry.type, entry.count]));
  const actionTypeItems = ACTION_TYPE_ORDER.map((type) => ({
    type,
    count: actionTypeCounts.get(type) ?? 0,
  })).filter((item) => item.count > 0);
  const maxTypeCount = actionTypeItems.length > 0 ? Math.max(...actionTypeItems.map((item) => item.count)) : 0;

  const statCards = [
    { label: "Actions (total)", value: stats.actionsTotal },
    { label: "Actions (30 derniers jours)", value: stats.actionsLast30Days },
    { label: "Opportunités", value: stats.opportunities },
    { label: "Contacts", value: stats.contacts },
    { label: "Entreprises", value: stats.companies },
    { label: "Entretiens", value: stats.entretiens },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tableau de bord</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Les 20 dernières actions réalisées et un aperçu des chiffres clés.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{stat.label}</div>
            <div className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Dernières actions</h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Les 20 mises à jour les plus récentes.</p>
            </div>
          </div>

          {recentActions.length === 0 ? (
            <div className="py-6 text-center text-sm text-neutral-500">Aucune action enregistrée pour le moment.</div>
          ) : (
            <div className="space-y-3">
              {recentActions.map((action) => (
                <div
                  key={action.id}
                  className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
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

                      <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                        {action.workOpportunity?.title ?? "Opportunité"}
                      </div>
                      {action.workOpportunity?.company && (
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          Entreprise: {action.workOpportunity.company.name}
                        </div>
                      )}

                      {action.notes && (
                        <p className="text-sm text-neutral-700 dark:text-neutral-300">{action.notes}</p>
                      )}

                      <div className="flex flex-wrap gap-3 text-xs text-neutral-600 dark:text-neutral-400">
                        {action.contactChannel && (
                          <span className="rounded bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800">
                            Canal: {action.contactChannel.value}
                            {action.contactChannel.label ? ` (${action.contactChannel.label})` : ""}
                          </span>
                        )}
                        {action.participants && action.participants.length > 0 && (
                          <span className="rounded bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800">
                            Participants:{" "}
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
          )}
        </div>

        <div className="space-y-4">
          <div className="card space-y-3">
            <div>
              <h3 className="text-lg font-semibold">Répartition des actions</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Volume par type sur l&apos;ensemble de vos actions.
              </p>
            </div>
            {actionTypeItems.length === 0 ? (
              <div className="py-4 text-sm text-neutral-500">Pas encore de répartition disponible.</div>
            ) : (
              <div className="space-y-3">
                {actionTypeItems.map((item) => (
                  <div key={item.type} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{ACTION_TYPE_LABELS[item.type] ?? item.type}</span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-800">
                      <div
                        className={`h-2 rounded-full ${ACTION_TYPE_COLORS[item.type] ?? ACTION_TYPE_COLORS.DEFAULT}`}
                        style={{
                          width: maxTypeCount > 0 ? `${(item.count / maxTypeCount) * 100}%` : "0%",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
