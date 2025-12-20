"use client";

import { useState, useEffect } from "react";
import { pushToast } from "@/components/common/Toast";
import { Modal } from "@/components/common/Modal";
import { CompanyForm } from "@/components/companies/CompanyForm";
import type { CompanyDTO } from "@/lib/dto/company";

type Props = {
  onSuccess?: () => void;
};

export function OpportunityForm({ onSuccess }: Props) {
  const [companies, setCompanies] = useState<CompanyDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    companyId: "",
  });

  const loadCompanies = async () => {
    const res = await fetch("/api/companies");
    if (!res.ok) return;
    const data = await res.json();
    setCompanies(data.items ?? []);
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleCompanyCreated = async (newCompanyId?: string) => {
    await loadCompanies();
    setShowCompanyModal(false);
    if (newCompanyId) {
      setForm({ ...form, companyId: newCompanyId });
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          companyId: form.companyId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      pushToast({ type: "success", title: "Opportunité créée" });
      setForm({ title: "", description: "", companyId: "" });
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      pushToast({ type: "error", title: "Erreur opportunité", description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form className="space-y-3" onSubmit={submit}>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Entreprise</label>
            <button
              type="button"
              onClick={() => setShowCompanyModal(true)}
              className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              + Créer une entreprise
            </button>
          </div>
          <select
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            value={form.companyId}
            onChange={(e) => setForm({ ...form, companyId: e.target.value })}
          >
            <option value="">Sélectionner (optionnel)</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Titre</label>
        <input
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Description</label>
        <textarea
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
        />
      </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "En cours..." : "Créer"}
        </button>
      </form>
      <Modal open={showCompanyModal} title="Créer une entreprise" onClose={() => setShowCompanyModal(false)}>
        <CompanyForm
          onSuccess={async () => {
            const res = await fetch("/api/companies");
            if (res.ok) {
              const data = await res.json();
              const newCompanies = data.items ?? [];
              setCompanies(newCompanies);
              // Sélectionner la dernière entreprise créée
              if (newCompanies.length > 0) {
                const lastCompany = newCompanies[0]; // Les entreprises sont triées par createdAt desc
                setForm({ ...form, companyId: lastCompany.id });
              }
            }
            setShowCompanyModal(false);
          }}
        />
      </Modal>
    </>
  );
}

