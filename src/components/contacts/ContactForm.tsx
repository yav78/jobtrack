"use client";

import { useEffect, useState } from "react";
import { pushToast } from "@/components/common/Toast";

type CompanyOption = { id: string; name: string };

type Props = {
  onSuccess?: () => void;
};

export function ContactForm({ onSuccess }: Props) {
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    companyId: "",
    firstName: "",
    lastName: "",
    roleTitle: "",
    notes: "",
  });

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/companies");
      if (!res.ok) return;
      const data = await res.json();
      setCompanies(data.items ?? []);
      if (data.items?.length && !form.companyId) {
        setForm((f) => ({ ...f, companyId: data.items[0].id }));
      }
    };
    load();
    // form.companyId intentionally excluded to avoid reset loop after first set
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyId) {
      pushToast({ type: "error", title: "Sélectionnez une entreprise" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          roleTitle: form.roleTitle || undefined,
          notes: form.notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      pushToast({ type: "success", title: "Contact créé" });
      onSuccess?.();
      setForm((f) => ({ ...f, firstName: "", lastName: "", roleTitle: "", notes: "" }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      pushToast({ type: "error", title: "Erreur contact", description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-3" onSubmit={submit}>
      <div className="space-y-1">
        <label className="text-sm font-medium">Entreprise</label>
        <select
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          value={form.companyId}
          onChange={(e) => setForm({ ...form, companyId: e.target.value })}
        >
          <option value="">Sélectionner</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">Prénom</label>
          <input
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Nom</label>
          <input
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Rôle</label>
        <input
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          value={form.roleTitle}
          onChange={(e) => setForm({ ...form, roleTitle: e.target.value })}
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
        {loading ? "En cours..." : "Créer"}
      </button>
    </form>
  );
}

