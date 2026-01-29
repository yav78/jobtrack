"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/common/Modal";
import { pushToast } from "@/components/common/Toast";
import type { OpportunityActionType } from "@prisma/client";
import type { ContactDTO } from "@/lib/dto/contact";
import type { ChannelTypeDTO } from "@/lib/dto/channel";

const ACTION_TYPES: Array<{ value: OpportunityActionType; label: string }> = [
  { value: "INTERVIEW", label: "Entretien" },
  { value: "APPLIED", label: "Candidature" },
  { value: "INBOUND_CONTACT", label: "Contact entrant" },
  { value: "OUTBOUND_CONTACT", label: "Contact sortant" },
  { value: "MESSAGE", label: "Message" },
  { value: "CALL", label: "Appel" },
  { value: "FOLLOW_UP", label: "Relance" },
  { value: "OFFER_RECEIVED", label: "Offre reçue" },
  { value: "OFFER_ACCEPTED", label: "Offre acceptée" },
  { value: "REJECTED", label: "Refus" },
  { value: "NOTE", label: "Note" },
];

type CompanyOption = { id: string; name: string };

type Props = {
  open: boolean;
  onClose: () => void;
};

async function fetchCompanies(): Promise<CompanyOption[]> {
  try {
    const res = await fetch("/api/companies");
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

async function fetchContacts(companyId: string): Promise<ContactDTO[]> {
  try {
    const res = await fetch(`/api/contacts?companyId=${companyId}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

async function fetchChannelTypes(): Promise<ChannelTypeDTO[]> {
  try {
    const res = await fetch("/api/channel-types");
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

export function StandaloneActionForm({ open, onClose }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [contacts, setContacts] = useState<ContactDTO[]>([]);
  const [channelTypes, setChannelTypes] = useState<ChannelTypeDTO[]>([]);
  const [form, setForm] = useState({
    type: "OUTBOUND_CONTACT" as OpportunityActionType,
    occurredAt: new Date().toISOString().slice(0, 16),
    notes: "",
    channelTypeCode: "",
    companyId: "" as string,
    participantContactIds: [] as string[],
  });

  useEffect(() => {
    if (open) {
      fetchCompanies().then(setCompanies);
      fetchChannelTypes().then(setChannelTypes);
    }
  }, [open]);

  useEffect(() => {
    if (open && form.companyId) {
      fetchContacts(form.companyId).then(setContacts);
    } else {
      setContacts([]);
      setForm((f) => ({ ...f, participantContactIds: [] }));
    }
  }, [open, form.companyId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/actions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          occurredAt: new Date(form.occurredAt).toISOString(),
          notes: form.notes || undefined,
          channelTypeCode: form.channelTypeCode || undefined,
          companyId: form.companyId || undefined,
          participantContactIds:
            form.participantContactIds.length > 0 ? form.participantContactIds : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      pushToast({ type: "success", title: "Action créée" });
      setForm({
        type: "OUTBOUND_CONTACT",
        occurredAt: new Date().toISOString().slice(0, 16),
        notes: "",
        channelTypeCode: "",
        companyId: "",
        participantContactIds: [],
      });
      onClose();
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      pushToast({ type: "error", title: "Erreur", description: message });
    } finally {
      setLoading(false);
    }
  };

  const toggleContact = (contactId: string) => {
    setForm((f) => {
      const exists = f.participantContactIds.includes(contactId);
      const participantContactIds = exists
        ? f.participantContactIds.filter((id) => id !== contactId)
        : [...f.participantContactIds, contactId];
      return { ...f, participantContactIds };
    });
  };

  return (
    <Modal open={open} title="Nouvelle action (prise de contact)" onClose={onClose}>
      <form className="space-y-4" onSubmit={submit}>
        <div className="space-y-1">
          <label className="text-sm font-medium">Type</label>
          <select
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as OpportunityActionType })}
            required
          >
            {ACTION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Date et heure</label>
          <input
            type="datetime-local"
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            value={form.occurredAt}
            onChange={(e) => setForm({ ...form, occurredAt: e.target.value })}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Entreprise (optionnel)</label>
          <select
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            value={form.companyId}
            onChange={(e) => setForm({ ...form, companyId: e.target.value })}
          >
            <option value="">Aucune</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {contacts.length > 0 && (
          <div className="space-y-1">
            <label className="text-sm font-medium">Participants</label>
            <div className="max-h-32 space-y-1 overflow-y-auto rounded border border-neutral-300 p-2 dark:border-neutral-700">
              {contacts.map((contact) => (
                <label key={contact.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.participantContactIds.includes(contact.id)}
                    onChange={() => toggleContact(contact.id)}
                  />
                  <span>
                    {contact.firstName} {contact.lastName}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium">Type de canal (optionnel)</label>
          <select
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            value={form.channelTypeCode}
            onChange={(e) => setForm({ ...form, channelTypeCode: e.target.value })}
          >
            <option value="">Aucun</option>
            {channelTypes.map((channelType) => (
              <option key={channelType.code} value={channelType.code}>
                {channelType.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Notes (optionnel)</label>
          <textarea
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "En cours..." : "Créer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
