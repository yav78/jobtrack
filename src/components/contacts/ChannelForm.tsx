"use client";

import { useState } from "react";
import { pushToast } from "@/components/common/Toast";
import contactService from "@/lib/services/front/contact.service";

type Props = {
  contactId: string;
  onSuccess?: () => void;
};

export function ChannelForm({ contactId, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    channelTypeCode: "EMAIL",
    value: "",
    label: "",
    isPrimary: false,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await contactService.createChannel(contactId, {
        ...form,
        label: form.label || undefined,
      });
      pushToast({ type: "success", title: "Canal ajouté" });
      setForm({ channelTypeCode: "EMAIL", value: "", label: "", isPrimary: false });
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      pushToast({ type: "error", title: "Erreur canal", description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-3" onSubmit={submit}>
      <div className="space-y-1">
        <label className="text-sm font-medium">Type</label>
        <select
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          value={form.channelTypeCode}
          onChange={(e) => setForm({ ...form, channelTypeCode: e.target.value })}
        >
          <option value="EMAIL">Email</option>
          <option value="PHONE">Téléphone</option>
          <option value="LINKEDIN">LinkedIn</option>
          <option value="OTHER">Autre</option>
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Valeur</label>
        <input
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          value={form.value}
          onChange={(e) => setForm({ ...form, value: e.target.value })}
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Label</label>
        <input
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.isPrimary}
          onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })}
        />
        Marquer comme canal principal pour ce type
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

