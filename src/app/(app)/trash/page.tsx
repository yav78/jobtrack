"use client";

import { useEffect, useState } from "react";
import { frontFetchJson } from "@/lib/services/front/abstract-crus.service";

type TrashedCompany = { id: string; name: string; deletedAt: string };
type TrashedContact = {
  id: string;
  firstName: string;
  lastName: string;
  deletedAt: string;
  company?: { id: string; name: string };
};
type TrashedOpportunity = {
  id: string;
  title: string;
  deletedAt: string;
  company?: { id: string; name: string };
};

type TrashData = {
  companies: TrashedCompany[];
  contacts: TrashedContact[];
  opportunities: TrashedOpportunity[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function TrashPage() {
  const [data, setData] = useState<TrashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await frontFetchJson<TrashData>("/api/trash");
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const restore = async (entity: string, id: string) => {
    const key = `${entity}:${id}`;
    try {
      setActionLoading(key);
      await frontFetchJson(`/api/trash/${entity}/${id}`, { method: "PATCH" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la restauration.");
    } finally {
      setActionLoading(null);
    }
  };

  const permanentDelete = async (entity: string, id: string, label: string) => {
    if (!confirm(`Supprimer définitivement "${label}" ? Cette action est irréversible.`)) return;
    const key = `${entity}:${id}`;
    try {
      setActionLoading(key);
      await frontFetchJson(`/api/trash/${entity}/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression.");
    } finally {
      setActionLoading(null);
    }
  };

  const total = data ? data.companies.length + data.contacts.length + data.opportunities.length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Corbeille</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Éléments supprimés — restaurez-les ou supprimez-les définitivement.
        </p>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 rounded bg-neutral-200 dark:bg-neutral-700" />
          ))}
        </div>
      ) : total === 0 ? (
        <div className="card text-center text-sm text-neutral-500 py-10">La corbeille est vide.</div>
      ) : (
        <div className="space-y-6">
          {/* Entreprises */}
          {data!.companies.length > 0 && (
            <div className="card space-y-3">
              <h2 className="font-semibold">Entreprises ({data!.companies.length})</h2>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {data!.companies.map((c) => {
                  const key = `companies:${c.id}`;
                  return (
                    <div key={c.id} className="flex items-center justify-between py-2">
                      <div>
                        <span className="font-medium">{c.name}</span>
                        <span className="ml-2 text-xs text-neutral-500">Supprimé le {formatDate(c.deletedAt)}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => restore("companies", c.id)}
                          disabled={actionLoading === key}
                          className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                        >
                          Restaurer
                        </button>
                        <button
                          type="button"
                          onClick={() => permanentDelete("companies", c.id, c.name)}
                          disabled={actionLoading === key}
                          className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:hover:bg-red-950"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Contacts */}
          {data!.contacts.length > 0 && (
            <div className="card space-y-3">
              <h2 className="font-semibold">Contacts ({data!.contacts.length})</h2>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {data!.contacts.map((c) => {
                  const key = `contacts:${c.id}`;
                  return (
                    <div key={c.id} className="flex items-center justify-between py-2">
                      <div>
                        <span className="font-medium">
                          {c.firstName} {c.lastName}
                        </span>
                        {c.company && (
                          <span className="ml-2 text-xs text-neutral-500">{c.company.name}</span>
                        )}
                        <span className="ml-2 text-xs text-neutral-500">Supprimé le {formatDate(c.deletedAt)}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => restore("contacts", c.id)}
                          disabled={actionLoading === key}
                          className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                        >
                          Restaurer
                        </button>
                        <button
                          type="button"
                          onClick={() => permanentDelete("contacts", c.id, `${c.firstName} ${c.lastName}`)}
                          disabled={actionLoading === key}
                          className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:hover:bg-red-950"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Opportunités */}
          {data!.opportunities.length > 0 && (
            <div className="card space-y-3">
              <h2 className="font-semibold">Opportunités ({data!.opportunities.length})</h2>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {data!.opportunities.map((o) => {
                  const key = `opportunities:${o.id}`;
                  return (
                    <div key={o.id} className="flex items-center justify-between py-2">
                      <div>
                        <span className="font-medium">{o.title}</span>
                        {o.company && (
                          <span className="ml-2 text-xs text-neutral-500">{o.company.name}</span>
                        )}
                        <span className="ml-2 text-xs text-neutral-500">Supprimé le {formatDate(o.deletedAt)}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => restore("opportunities", o.id)}
                          disabled={actionLoading === key}
                          className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                        >
                          Restaurer
                        </button>
                        <button
                          type="button"
                          onClick={() => permanentDelete("opportunities", o.id, o.title)}
                          disabled={actionLoading === key}
                          className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:hover:bg-red-950"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
