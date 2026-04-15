"use client";

import { useEffect, useState } from "react";
import { pushToast } from "@/components/common/Toast";
import type { ContactDTO } from "@/lib/dto/contact";
import contactService from "@/lib/services/front/contact.service";
import companyService from "@/lib/services/front/company.service";
import { CompanyQuickCreateModal } from "@/components/companies/CompanyQuickCreateModal";

type CompanyOption = { id: string; name: string };
type ChannelRow = { channelTypeCode: string; value: string };

const CHANNEL_TYPES = [
  { code: "EMAIL", label: "Email" },
  { code: "PHONE", label: "Téléphone" },
  { code: "LINKEDIN", label: "LinkedIn" },
  { code: "OTHER", label: "Autre" },
];

type Props = {
  onSuccess?: (data: ContactDTO) => void;
};

export function ContactForm({ onSuccess }: Props) {
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [channels, setChannels] = useState<ChannelRow[]>([]);
  const [form, setForm] = useState({
    companyId: "",
    firstName: "",
    lastName: "",
    roleTitle: "",
    notes: "",
  });

  useEffect(() => {
    companyService.list().then(setCompanies);
  }, []);

  const addChannel = () =>
    setChannels((prev) => [...prev, { channelTypeCode: "EMAIL", value: "" }]);

  const removeChannel = (i: number) =>
    setChannels((prev) => prev.filter((_, idx) => idx !== i));

  const updateChannel = (i: number, field: keyof ChannelRow, value: string) =>
    setChannels((prev) => prev.map((ch, idx) => (idx === i ? { ...ch, [field]: value } : ch)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await contactService.create<ContactDTO>({
        ...(form.companyId ? { companyId: form.companyId } : {}),
        firstName: form.firstName,
        lastName: form.lastName,
        roleTitle: form.roleTitle || undefined,
        notes: form.notes || undefined,
        channels: channels.filter((ch) => ch.value.trim()),
      });
      pushToast({ type: "success", title: "Contact créé" });
      onSuccess?.(data);
      setForm({ companyId: "", firstName: "", lastName: "", roleTitle: "", notes: "" });
      setChannels([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      pushToast({ type: "error", title: "Erreur contact", description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CompanyQuickCreateModal
        open={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        onSuccess={(company) => {
          setCompanies((prev) => [...prev, company]);
          setForm((f) => ({ ...f, companyId: company.id }));
          setQuickCreateOpen(false);
        }}
      />
      <form className="space-y-3" onSubmit={submit}>
        <div className="space-y-1">
          <label className="text-sm font-medium">
            Entreprise <span className="font-normal text-neutral-400">(optionnel)</span>
          </label>
          <div className="flex gap-2">
            <select
              className="flex-1 rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              value={form.companyId}
              onChange={(e) => setForm({ ...form, companyId: e.target.value })}
            >
              <option value="">Aucune</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setQuickCreateOpen(true)}
              className="whitespace-nowrap rounded border border-emerald-600 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
            >
              + Créer
            </button>
          </div>
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

        <div className="space-y-2">
          <label className="text-sm font-medium">Canaux de communication</label>
          {channels.map((ch, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                className="rounded border border-neutral-300 px-2 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                value={ch.channelTypeCode}
                onChange={(e) => updateChannel(i, "channelTypeCode", e.target.value)}
              >
                {CHANNEL_TYPES.map((t) => (
                  <option key={t.code} value={t.code}>{t.label}</option>
                ))}
              </select>
              <input
                className="flex-1 rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                value={ch.value}
                onChange={(e) => updateChannel(i, "value", e.target.value)}
                placeholder="Valeur"
              />
              <button
                type="button"
                onClick={() => removeChannel(i)}
                aria-label="Supprimer ce canal"
                className="text-lg leading-none text-neutral-400 hover:text-red-500"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addChannel}
            className="rounded border border-dashed border-emerald-600 px-3 py-1 text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
          >
            + Ajouter un canal
          </button>
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
    </>
  );
}
