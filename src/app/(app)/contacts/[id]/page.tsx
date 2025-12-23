import { notFound } from "next/navigation";
import { ChannelForm } from "@/components/contacts/ChannelForm";
import { absoluteUrl } from "@/lib/api";

type ContactDetail = {
  id: string;
  firstName: string;
  lastName: string;
  roleTitle?: string | null;
  notes?: string | null;
  channels?: {
    id: string;
    channelTypeCode: string;
    value: string;
    label?: string | null;
    isPrimary: boolean;
  }[];
};

async function fetchContact(id: string): Promise<ContactDetail | null> {
  const res = await fetch(absoluteUrl(`/api/contacts/${id}`), { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await params;
  const contact = await fetchContact(id);
  if (!contact) return notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {contact.firstName} {contact.lastName}
          </h1>
          {contact.roleTitle && <p className="text-sm text-neutral-600 dark:text-neutral-300">{contact.roleTitle}</p>}
        </div>
      </div>
      <div className="card space-y-3">
        <h3 className="text-sm font-semibold">Canaux</h3>
        <ul className="space-y-2 text-sm">
          {contact.channels?.length ? (
            contact.channels.map((ch) => (
              <li key={ch.id} className="rounded border border-neutral-200 p-2 dark:border-neutral-800">
                <div className="font-medium">
                  {ch.channelTypeCode} {ch.isPrimary ? "(principal)" : ""}
                </div>
                <div className="text-neutral-700 dark:text-neutral-300">
                  {ch.value} {ch.label ? `(${ch.label})` : ""}
                </div>
              </li>
            ))
          ) : (
            <div className="text-neutral-500">Aucun canal</div>
          )}
        </ul>
        <div className="mt-3">
          <h4 className="text-sm font-semibold">Ajouter un canal</h4>
          <ChannelForm contactId={contact.id} />
        </div>
      </div>
      {contact.notes && (
        <div className="card">
          <h3 className="text-sm font-semibold">Notes</h3>
          <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-line">{contact.notes}</p>
        </div>
      )}
    </div>
  );
}

