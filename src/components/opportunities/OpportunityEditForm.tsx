"use client";

import { useState, useEffect } from "react";
import { pushToast } from "@/components/common/Toast";
import { Modal } from "@/components/common/Modal";
import { CompanyForm } from "@/components/companies/CompanyForm";
import type { WorkOpportunityDTO } from "@/lib/dto/opportunity";
import type { CompanyDTO } from "@/lib/dto/company";
import companyService from "@/lib/services/front/company.service";
import opportunityService from "@/lib/services/front/opportunity.service";
import {
  OPPORTUNITY_STATUS_LABELS,
  OPPORTUNITY_STATUS_ORDER,
} from "@/constants/opportunityStatus";

type Props = {
  opportunity: WorkOpportunityDTO;
  onSuccess?: (data: WorkOpportunityDTO) => void;
  onCancel?: () => void;
};

function toDatetimeLocal(iso?: string | null): string {
  if (!iso) return "";
  // Convert ISO string to yyyy-MM-dd for date input
  return iso.slice(0, 10);
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function OpportunityEditForm({ opportunity, onSuccess, onCancel }: Props) {
  const [companies, setCompanies] = useState<CompanyDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [form, setForm] = useState({
    title: opportunity.title,
    description: opportunity.description || "",
    companyId: opportunity.companyId || "",
    status: opportunity.status || "SOURCING",
    followUpAt: toDatetimeLocal(opportunity.followUpAt),
  });

  useEffect(() => {
    setForm({
      title: opportunity.title,
      description: opportunity.description || "",
      companyId: opportunity.companyId || "",
      status: opportunity.status || "SOURCING",
      followUpAt: toDatetimeLocal(opportunity.followUpAt),
    });
  }, [opportunity]);

  const loadCompanies = async () => {
    const items = await companyService.list();
    setCompanies(items);
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await opportunityService.update<WorkOpportunityDTO>(opportunity.id, {
        title: form.title,
        description: form.description || undefined,
        companyId: form.companyId || undefined,
        status: form.status,
        followUpAt: form.followUpAt ? new Date(form.followUpAt).toISOString() : null,
      });
      pushToast({ type: "success", title: "Opportunité mise à jour" });
      onSuccess?.(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      pushToast({ type: "error", title: "Erreur mise à jour", description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form className="space-y-3" onSubmit={submit}>
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
          <label className="text-sm font-medium">Statut</label>
          <select
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            {OPPORTUNITY_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {OPPORTUNITY_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

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
          <label className="text-sm font-medium">Description</label>
          <textarea
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Date de relance</label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="flex-1 rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              value={form.followUpAt}
              onChange={(e) => setForm({ ...form, followUpAt: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setForm({ ...form, followUpAt: "" })}
              className="rounded border border-neutral-300 px-2 py-2 text-xs text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
              aria-label="Effacer la date de relance"
            >
              ✕
            </button>
          </div>
          <div className="flex gap-1 pt-1">
            {[3, 7, 14, 30].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setForm({ ...form, followUpAt: addDays(days) })}
                className="rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                +{days}j
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "En cours..." : "Enregistrer"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 disabled:opacity-50"
            >
              Annuler
            </button>
          )}
        </div>
      </form>
      <Modal open={showCompanyModal} title="Créer une entreprise" onClose={() => setShowCompanyModal(false)}>
        <CompanyForm
          onSuccess={async () => {
            await loadCompanies();
            setShowCompanyModal(false);
          }}
        />
      </Modal>
    </>
  );
}
