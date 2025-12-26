import { ContactForm } from "@/components/contacts/ContactForm";
import { ContactsTable } from "@/components/contacts/ContactsTable";
import contactService from "@/lib/services/front/contact.service";

type ContactRow = {
  id: string;
  firstName: string;
  lastName: string;
  companyId: string;
};

export default async function ContactsPage() {
  const contacts = await contactService.list();

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
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
