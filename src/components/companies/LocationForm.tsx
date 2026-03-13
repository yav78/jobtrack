"use client";

import { useState } from "react";
import { pushToast } from "@/components/common/Toast";
import companyService from "@/lib/services/front/company.service";

import type { LocationDTO } from "@/lib/dto/company";

type Props = {
  companyId: string;
  onSuccess?: (data: LocationDTO) => void;
};

export function LocationForm({ companyId, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    label: "",
    addressLine1: "",
    addressLine2: "",
    zipCode: "",
    city: "",
    country: "",
    isPrimary: false,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await companyService.createLocation(companyId, {
        ...form,
        addressLine2: form.addressLine2 || undefined,
      });
      pushToast({ type: "success", title: "Lieu créé" });
      onSuccess?.(data);
      
      setForm({
        label: "",
        addressLine1: "",
        addressLine2: "",
        zipCode: "",
        city: "",
        country: "",
        isPrimary: false,
      });
      
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      pushToast({ type: "error", title: "Erreur lieu", description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-3" onSubmit={submit}>
      <div className="space-y-1">
        <label className="text-sm font-medium">Label</label>
        <input
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Adresse ligne 1</label>
        <input
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          value={form.addressLine1}
          onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Adresse ligne 2</label>
        <input
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          value={form.addressLine2}
          onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">Code postal</label>
          <input
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            value={form.zipCode}
            onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Ville</label>
          <input
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Pays</label>
        <input
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          value={form.country}
          onChange={(e) => setForm({ ...form, country: e.target.value })}
          required
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.isPrimary}
          onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })}
        />
        Marquer comme lieu principal
      </label>
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? "En cours..." : "Ajouter"}
      </button>
    </form>
  );
}

