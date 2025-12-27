"use client";
import { ContactForm } from "@/components/contacts/ContactForm";
import { ContactsTable } from "@/components/contacts/ContactsTable";
import { ContactDTO } from "@/lib/dto/contact";

import contactService from "@/lib/services/front/contact.service";
import { useEffect, useState } from "react";


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
  // await contactService.list();
  const [contacts, setContacts] = useState<ContactRow[] >([]);
  useEffect(() => {
    const load = async () => {
      const data = await contactService.list();
      console.log(data);
      setContacts(convertToContactRow(data));
    };
    load();
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
          <ContactsTable data={contacts} />
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold">Créer un contact</h2>
          <ContactForm onSuccess={(contact) => {
            const newContacts = [...contacts, contact];
            setContacts(newContacts);
          }} />
        </div>
      </div>
    </div>
  );
}
