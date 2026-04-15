"use client";
import { ContactForm } from "@/components/contacts/ContactForm";
import { ContactsTable } from "@/components/contacts/ContactsTable";
import { Pagination } from "@/components/common/Pagination";
import { ExportButton } from "@/components/common/ExportButton";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Modal } from "@/components/common/Modal";
import { ContactDTO } from "@/lib/dto/contact";

import contactService from "@/lib/services/front/contact.service";
import { useEffect, useState } from "react";
import { frontFetchJson } from "@/lib/services/front/abstract-crus.service";

const PAGE_SIZE = 20;

type ContactRow = {
  id: string;
  firstName: string;
  lastName: string;
  companyId: string | null;
  company?: { id: string; name: string } | null;
};

function convertToContactRow(contacts: ContactDTO[]): ContactRow[] {
  return contacts.map((contact) => ({
    id: contact.id,
    firstName: contact.firstName,
    lastName: contact.lastName,
    companyId: contact.companyId,
    company: contact.company,
  }));
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const load = async (p: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await contactService.list(p, PAGE_SIZE);
      setContacts(convertToContactRow(data.items));
      setTotal(data.total);
      setPage(data.page);
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des contacts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  const handleBulkDelete = async () => {
    setConfirmOpen(false);
    try {
      setBulkLoading(true);
      await frontFetchJson("/api/contacts/bulk", {
        method: "POST",
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      await load(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression.");
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Contacts</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">Liste des contacts.</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton href="/api/export/contacts" label="Exporter CSV" />
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Nouveau contact
          </button>
        </div>
      </div>

      <div className="card space-y-3">
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {selectedIds.size} sélectionné(s)
            </span>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={bulkLoading}
              className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-50"
            >
              Supprimer la sélection
            </button>
          </div>
        )}
        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 rounded bg-neutral-200 dark:bg-neutral-700" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        ) : (
          <>
            <ContactsTable
              data={contacts}
              selectable
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={load} />
          </>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Créer un contact">
        <ContactForm
          onSuccess={(contact) => {
            setContacts((prev) => [contact, ...prev]);
            setTotal((t) => t + 1);
            setCreateOpen(false);
          }}
        />
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title={`Supprimer ${selectedIds.size} contact(s) ?`}
        description="Cette action est réversible depuis la corbeille."
        confirmLabel="Supprimer"
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
