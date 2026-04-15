"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/common/Modal";
import { pushToast } from "@/components/common/Toast";
import companyService from "@/lib/services/front/company.service";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: (company: { id: string; name: string }) => void;
};

export function CompanyQuickCreateModal({ open, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", typeCode: "CLIENT_FINAL" });

  useEffect(() => {
    if (open) {
      setForm({ name: "", typeCode: "CLIENT_FINAL" });
      setLoading(false);
    }
  }, [open]);

  const handleClose = () => {
    if (!loading) onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await companyService.create<{ id: string; name: string }>(form);
      pushToast({ type: "success", title: "Entreprise créée" });
      onSuccess(data);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      pushToast({ type: "error", title: "Erreur création", description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Créer une entreprise">
      <form className="space-y-3" onSubmit={submit}>
        <div className="space-y-1">
          <label className="text-sm font-medium">Nom</label>
          <input
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            autoFocus
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Type</label>
          <select
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            value={form.typeCode}
            onChange={(e) => setForm({ ...form, typeCode: e.target.value })}
          >
            <option value="CLIENT_FINAL">Client final</option>
            <option value="ESN">ESN</option>
            <option value="PORTAGE">Portage</option>
            <option value="OTHER">Autre</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "En cours..." : "Créer"}
          </button>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 disabled:opacity-50"
          >
            Annuler
          </button>
        </div>
      </form>
    </Modal>
  );
}
