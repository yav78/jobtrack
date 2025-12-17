import Link from "next/link";
import { ContactForm } from "@/components/contacts/ContactForm";
import { DataTable } from "@/components/common/DataTable";

type ContactRow = {
  id: string;
  firstName: string;
  lastName: string;
  companyId: string;
};

async function fetchContacts(): Promise<ContactRow[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/contacts`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.items ?? [];
}

export default async function ContactsPage() {
  const contacts = await fetchContacts();

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
          <DataTable
            data={contacts}
            empty="Aucun contact"
            columns={[
              {
                header: "Nom",
                render: (row: ContactRow) => (
                  <Link href={`/contacts/${row.id}`}>
                    {row.firstName} {row.lastName}
                  </Link>
                ),
              },
              { header: "Entreprise", render: () => "—" },
            ]}
          />
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold">Créer un contact</h2>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}

