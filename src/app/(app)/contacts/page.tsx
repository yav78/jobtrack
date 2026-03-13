"use client";
import { ContactForm } from "@/components/contacts/ContactForm";
import { ContactsTable } from "@/components/contacts/ContactsTable";
import { Pagination } from "@/components/common/Pagination";
import { ContactDTO } from "@/lib/dto/contact";

import contactService from "@/lib/services/front/contact.service";
import { useEffect, useState } from "react";

const PAGE_SIZE = 20;

type ContactRow = {
  id: string;
  firstName: string;
  lastName: string;
  companyId: string;
  company?: {
    id: string;
    name: string;
  };
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

  const load = async (p: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await contactService.list(p, PAGE_SIZE);
      setContacts(convertToContactRow(data.items));
      setTotal(data.total);
      setPage(data.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des contacts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Contacts</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">Liste des contacts et création rapide.</p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="card">
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
              <ContactsTable data={contacts} />
              <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={load} />
            </>
          )}
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold">Créer un contact</h2>
          <ContactForm onSuccess={(contact) => {
            setContacts((prev) => [contact, ...prev]);
            setTotal((t) => t + 1);
          }} />
        </div>
      </div>
    </div>
  );
}
