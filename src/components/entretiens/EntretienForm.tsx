"use client";

import { useEffect, useMemo, useState } from "react";
import { pushToast } from "@/components/common/Toast";

type Option = { id: string; label: string };

export function EntretienForm() {
  const [loading, setLoading] = useState(false);
  const [opportunities, setOpportunities] = useState<Option[]>([]);
  const [contacts, setContacts] = useState<Option[]>([]);
  const [channels, setChannels] = useState<{ id: string; contactId: string; value: string }[]>([]);

  const [form, setForm] = useState({
    date: "",
    workOpportunityId: "",
    contactIds: [] as string[],
    contactChannelId: "",
  });

  useEffect(() => {
    const load = async () => {
      const [oppRes, contactRes] = await Promise.all([fetch("/api/opportunities"), fetch("/api/contacts")]);
      if (oppRes.ok) {
        const data = await oppRes.json();
        setOpportunities((data.items ?? []).map((o: { id: string; title: string }) => ({ id: o.id, label: o.title })));
      }
      if (contactRes.ok) {
        const data = await contactRes.json();
        setContacts(
          (data.items ?? []).map((c: { id: string; firstName: string; lastName: string }) => ({
            id: c.id,
            label: `${c.firstName} ${c.lastName}`,
          }))
        );
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadChannels = async () => {
      if (!form.contactIds.length) return setChannels([]);
      const res = await fetch("/api/contacts");
      if (!res.ok) return;
      const data = await res.json();
      const selected = (data.items ?? []).filter((c: { id: string }) => form.contactIds.includes(c.id));
      const chans = selected.flatMap((c: { id: string; channels?: { id: string; value: string }[] }) =>
        (c.channels ?? []).map((ch) => ({ id: ch.id, contactId: c.id, value: ch.value }))
      );
      setChannels(chans);
      if (chans.length && !form.contactChannelId) {
        setForm((f) => ({ ...f, contactChannelId: chans[0].id }));
      }
    };
    loadChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.contactIds.join(",")]);

  const filteredChannels = useMemo(() => {
    if (!form.contactIds.length) return [];
    return channels.filter((c) => form.contactIds.includes(c.contactId));
  }, [channels, form.contactIds]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.contactIds.length) {
      pushToast({ type: "error", title: "Au moins un contact requis" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/entretiens", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          date: form.date,
          workOpportunityId: form.workOpportunityId,
          contactChannelId: form.contactChannelId,
          contactIds: form.contactIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      pushToast({ type: "success", title: "Entretien créé" });
      setForm({ date: "", workOpportunityId: "", contactIds: [], contactChannelId: "" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      pushToast({ type: "error", title: "Erreur entretien", description: message });
    } finally {
      setLoading(false);
    }
  };

  const toggleContact = (id: string) => {
    setForm((f) => {
      const exists = f.contactIds.includes(id);
      const contactIds = exists ? f.contactIds.filter((c) => c !== id) : [...f.contactIds, id];
      return { ...f, contactIds };
    });
  };

  return (
    <form className="space-y-3" onSubmit={submit}>
      <div className="space-y-1">
        <label className="text-sm font-medium">Date & heure</label>
        <input
          type="datetime-local"
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Opportunité</label>
        <select
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          value={form.workOpportunityId}
          onChange={(e) => setForm({ ...form, workOpportunityId: e.target.value })}
          required
        >
          <option value="">Sélectionner</option>
          {opportunities.map((o) => (
            <option key={o.id} value={o.id}>
              o.label
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <div className="text-sm font-medium">Contacts</div>
        <div className="space-y-1 rounded border border-neutral-200 p-2 dark:border-neutral-800">
          {contacts.map((c) => {
            const checked = form.contactIds.includes(c.id);
            return (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={checked} onChange={() => toggleContact(c.id)} />
                {c.label}
              </label>
            );
          })}
          {!contacts.length && <div className="text-sm text-neutral-500">Aucun contact</div>}
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Canal</label>
        <select
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          value={form.contactChannelId}
          onChange={(e) => setForm({ ...form, contactChannelId: e.target.value })}
          required
        >
          <option value="">Sélectionner</option>
          {filteredChannels.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {ch.value}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? "En cours..." : "Créer l'entretien"}
      </button>
    </form>
  );
}

