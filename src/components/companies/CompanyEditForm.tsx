"use client";

import { useState, useEffect } from "react";
import { pushToast } from "@/components/common/Toast";
import type { CompanyDTO } from "@/lib/dto/company";
import { useCompanyTypes } from "@/hooks/useCompanyTypes";

type Props = {
  company: CompanyDTO;
  onSuccess?: (data: CompanyDTO) => void;
};

export function CompanyEditForm({ company, onSuccess }: Props) {
  const { companyTypes } = useCompanyTypes();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: company.name,
    typeCode: company.typeCode,
    website: company.website || "",
    notes: company.notes || "",
  });

  // Mettre à jour le formulaire si l'entreprise change
  useEffect(() => {
    setForm({
      name: company.name,
      typeCode: company.typeCode,
      website: company.website || "",
      notes: company.notes || "",
    });
  }, [company]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/companies/${company.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          typeCode: form.typeCode,
          website: form.website || undefined,
          notes: form.notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      pushToast({ type: "success", title: "Entreprise mise à jour" });
      onSuccess?.(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      pushToast({ type: "error", title: "Erreur mise à jour", description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-3" onSubmit={submit}>
      <div className="space-y-1">
        <label className="text-sm font-medium">Nom</label>
        <input
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Type</label>
        <select
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          value={form.typeCode}
          onChange={(e) => setForm({ ...form, typeCode: e.target.value })}
        >
          {companyTypes.map((type) => (
            <option key={type.code} value={type.code}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Site web</label>
        <input
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          value={form.website}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
          placeholder="https://exemple.com"
          type="url"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Notes</label>
        <textarea
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? "En cours..." : "Enregistrer"}
      </button>
    </form>
  );
}


