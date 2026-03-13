"use client";

import { useEffect, useState } from "react";
import { pushToast } from "@/components/common/Toast";
import { ContactDTO } from "@/lib/dto/contact";
import contactService from "@/lib/services/front/contact.service";
import companyService from "@/lib/services/front/company.service";

type CompanyOption = { id: string; name: string };

type Props = {
  onSuccess?: (data: ContactDTO) => void;
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
      const items = await companyService.list();
      setCompanies(items);
      if (items.length) {
        setForm((f) => ({ ...f, companyId: f.companyId || items[0].id }));
      }
    };
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyId) {
      pushToast({ type: "error", title: "Sélectionnez une entreprise" });
      return;
    }
    setLoading(true);
    try {
      const data = await contactService.create<ContactDTO>({
        ...form,
        roleTitle: form.roleTitle || undefined,
        notes: form.notes || undefined,
      });
      pushToast({ type: "success", title: "Contact créé" });
      onSuccess?.(data);
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

