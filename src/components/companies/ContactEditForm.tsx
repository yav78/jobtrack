"use client";

import { useState, useEffect } from "react";
import { pushToast } from "@/components/common/Toast";
import type { ContactDTO } from "@/lib/dto/contact";

type Props = {
  contact: ContactDTO;
  onSuccess?: (data: ContactDTO) => void;
  onCancel?: () => void;
};

export function ContactEditForm({ contact, onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: contact.firstName,
    lastName: contact.lastName,
    roleTitle: contact.roleTitle || "",
    notes: contact.notes || "",
  });

  // Mettre à jour le formulaire si le contact change
  useEffect(() => {
    setForm({
      firstName: contact.firstName,
      lastName: contact.lastName,
      roleTitle: contact.roleTitle || "",
      notes: contact.notes || "",
    });
  }, [contact]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          roleTitle: form.roleTitle || undefined,
          notes: form.notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      pushToast({ type: "success", title: "Contact mis à jour" });
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
  );
}





