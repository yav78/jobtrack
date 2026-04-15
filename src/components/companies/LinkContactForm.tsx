"use client";

import { useEffect, useState } from "react";
import { pushToast } from "@/components/common/Toast";
import type { ContactDTO } from "@/lib/dto/contact";
import contactService from "@/lib/services/front/contact.service";

type Props = {
  companyId: string;
  onSuccess: (contact: ContactDTO) => void;
};

export function LinkContactForm({ companyId, onSuccess }: Props) {
  const [unlinked, setUnlinked] = useState<ContactDTO[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    contactService.listUnlinked().then(setUnlinked);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setLoading(true);
    try {
      const data = await contactService.update<ContactDTO>(selectedId, { companyId });
      pushToast({ type: "success", title: "Contact lié" });
      setUnlinked((prev) => prev.filter((c) => c.id !== selectedId));
      setSelectedId("");
      onSuccess(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      pushToast({ type: "error", title: "Erreur liaison", description: message });
    } finally {
      setLoading(false);
    }
  };

  if (unlinked.length === 0) {
    return (
      <p className="text-sm text-neutral-500">Aucun contact sans entreprise à lier.</p>
    );
  }

  return (
    <form className="space-y-3" onSubmit={submit}>
      <div className="space-y-1">
        <select
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="">Sélectionner un contact...</option>
          {unlinked.map((c) => (
            <option key={c.id} value={c.id}>
              {c.firstName} {c.lastName}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={loading || !selectedId}
        className="rounded bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? "En cours..." : "Lier"}
      </button>
    </form>
  );
}
