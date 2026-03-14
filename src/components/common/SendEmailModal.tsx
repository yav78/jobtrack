"use client";

import { useState } from "react";
import { frontFetchJson } from "@/lib/services/front/abstract-crus.service";
import { pushToast } from "@/components/common/Toast";
import { Modal } from "@/components/common/Modal";

type Props = {
  defaultTo?: string;
  defaultSubject?: string;
  defaultText?: string;
  triggerLabel?: string;
};

export function SendEmailModal({
  defaultTo = "",
  defaultSubject = "",
  defaultText = "",
  triggerLabel = "Envoyer un email",
}: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ to: defaultTo, subject: defaultSubject, text: defaultText });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await frontFetchJson("/api/email/send", {
        method: "POST",
        body: JSON.stringify(form),
      });
      pushToast({ type: "success", title: "Email envoyé" });
      setOpen(false);
    } catch (err) {
      pushToast({
        type: "error",
        title: "Échec de l'envoi",
        description: err instanceof Error ? err.message : "Erreur inconnue",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        {triggerLabel}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Envoyer un email de relance">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">À</label>
            <input
              type="email"
              required
              value={form.to}
              onChange={(e) => setForm({ ...form, to: e.target.value })}
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              placeholder="destinataire@exemple.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Objet</label>
            <input
              type="text"
              required
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              placeholder="Suivi de candidature"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Message</label>
            <textarea
              required
              rows={6}
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "Envoi…" : "Envoyer"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
