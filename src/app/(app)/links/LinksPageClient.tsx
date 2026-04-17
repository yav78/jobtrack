"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { pushToast } from "@/components/common/Toast";
import type { LinkDTO, LinkListDTO } from "@/lib/dto/link";
import linkService, { type LinkCategoryFilter } from "@/lib/services/front/link.service";

const PAGE_SIZE = 20;

const CATEGORY_OPTIONS = [
  { value: "ALL" as const, label: "Toutes" },
  { value: "JOBBOARD" as const, label: "Jobboards" },
  { value: "TOOL" as const, label: "Outils" },
  { value: "NETWORK" as const, label: "Réseaux" },
  { value: "OTHER" as const, label: "Autres" },
] as const;

function categoryLabel(code: LinkDTO["category"]): string {
  const found = CATEGORY_OPTIONS.find((c) => c.value === code);
  return found?.label ?? code;
}

type Props = {
  initialList: LinkListDTO;
};

type FormState = {
  title: string;
  url: string;
  category: LinkDTO["category"];
  notes: string;
};

const emptyForm = (): FormState => ({
  title: "",
  url: "https://",
  category: "OTHER",
  notes: "",
});

export default function LinksPageClient({ initialList }: Props) {
  const [list, setList] = useState<LinkListDTO>(initialList);
  const [page, setPage] = useState(initialList.page);
  const [loading, setLoading] = useState(false);
  const [qInput, setQInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORY_OPTIONS)[number]["value"]>("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LinkDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(qInput.trim()), 350);
    return () => clearTimeout(t);
  }, [qInput]);

  const prevDebouncedQ = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (prevDebouncedQ.current === undefined) {
      prevDebouncedQ.current = debouncedQ;
      return;
    }
    if (prevDebouncedQ.current !== debouncedQ) {
      prevDebouncedQ.current = debouncedQ;
      setPage(1);
    }
  }, [debouncedQ]);

  const hydratedRef = useRef(false);
  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await linkService.list({
        page,
        pageSize: PAGE_SIZE,
        q: debouncedQ || undefined,
        category: category === "ALL" ? undefined : (category as LinkCategoryFilter),
      });
      setList(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur de chargement";
      pushToast({ type: "error", title: "Liens", description: message });
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQ, category]);

  useEffect(() => {
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }
    void fetchList();
  }, [fetchList]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (link: LinkDTO) => {
    setEditingId(link.id);
    setForm({
      title: link.title,
      url: link.url,
      category: link.category,
      notes: link.notes ?? "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        url: form.url.trim(),
        category: form.category,
        notes: form.notes.trim() || undefined,
      };
      if (editingId) {
        await linkService.updateLink(editingId, payload);
        pushToast({ type: "success", title: "Lien mis à jour" });
      } else {
        await linkService.createLink(payload);
        pushToast({ type: "success", title: "Lien créé" });
      }
      closeModal();
      await fetchList();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur";
      pushToast({ type: "error", title: "Enregistrement", description: message });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await linkService.remove(deleteTarget.id);
      pushToast({ type: "success", title: "Lien supprimé" });
      setDeleteTarget(null);
      await fetchList();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur";
      pushToast({ type: "error", title: "Suppression", description: message });
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(list.total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer ce lien ?"
        description={deleteTarget ? `« ${deleteTarget.title} » sera retiré de la bibliothèque.` : undefined}
        confirmLabel={deleting ? "Suppression…" : "Supprimer"}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Liens utiles</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Jobboards, outils et ressources — avec notes libres.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Nouveau lien
        </button>
      </div>

      <div className="card space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Recherche</label>
          <input
            type="search"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Titre, URL, notes…"
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setCategory(opt.value);
                setPage(1);
              }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                category === opt.value
                  ? "bg-emerald-600 text-white"
                  : "bg-neutral-200 text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="animate-pulse space-y-2 py-8 text-center text-sm text-neutral-500">Chargement…</div>
        ) : list.items.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-500">Aucun lien pour ces critères.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {list.items.map((item) => (
              <li key={item.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                      {item.title}
                    </a>
                    <span className="rounded bg-neutral-200 px-2 py-0.5 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                      {categoryLabel(item.category)}
                    </span>
                  </div>
                  <div className="truncate text-xs text-neutral-500">{item.url}</div>
                  {item.notes && (
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-line line-clamp-3">
                      {item.notes}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="text-sm text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    className="text-sm text-red-600 hover:underline dark:text-red-400"
                  >
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {list.total > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <span className="text-xs text-neutral-500">
              {list.total} lien(s) — page {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded border border-neutral-300 px-3 py-1 text-sm disabled:opacity-40 dark:border-neutral-700"
              >
                Précédent
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border border-neutral-300 px-3 py-1 text-sm disabled:opacity-40 dark:border-neutral-700"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-4 shadow-lg dark:bg-neutral-900">
            <h2 className="text-lg font-semibold">{editingId ? "Modifier le lien" : "Nouveau lien"}</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium">Titre</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">URL</label>
                <input
                  required
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Catégorie</label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value as LinkDTO["category"] }))
                  }
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                >
                  {CATEGORY_OPTIONS.filter((o) => o.value !== "ALL").map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={4}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
