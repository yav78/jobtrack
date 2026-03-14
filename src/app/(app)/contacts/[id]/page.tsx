import { notFound } from "next/navigation";
import { AddChannelButton } from "@/components/contacts/AddChannelButton";
import { ContactActionsSection } from "@/components/contacts/ContactActionsSection";
import { SendEmailModal } from "@/components/common/SendEmailModal";
import { getContact } from "@/lib/services/back/contacts";
import { requireUserId } from "@/lib/api-helpers";

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

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await params;
  const userId = await requireUserId();
  const contact = await getContact(id, userId);
  if (!contact) return notFound();

  const emailChannel = contact.channels?.find(
    (ch) => ch.channelTypeCode === "EMAIL" || ch.value.includes("@")
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {contact.firstName} {contact.lastName}
          </h1>
          {contact.roleTitle && <p className="text-sm text-neutral-600 dark:text-neutral-300">{contact.roleTitle}</p>}
        </div>
        <SendEmailModal
          defaultTo={emailChannel?.value ?? ""}
          defaultSubject={`Relance — ${contact.firstName} ${contact.lastName}`}
          defaultText={`Bonjour ${contact.firstName},\n\nJe me permets de vous recontacter suite à nos échanges.\n\nCordialement,`}
          triggerLabel="Envoyer un email"
        />
      </div>

      <ContactActionsSection contactId={contact.id} companyId={contact.companyId} />

      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Canaux</h3>
          <AddChannelButton contactId={contact.id} />
        </div>
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
            <div className="text-sm text-neutral-500">
              Aucun canal de contact.
            </div>
          )}
        </ul>
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
