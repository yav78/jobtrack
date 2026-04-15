import { notFound } from "next/navigation";
import { AddChannelButton } from "@/components/contacts/AddChannelButton";
import { ContactActionsSection } from "@/components/contacts/ContactActionsSection";
import { ContactEditButton } from "@/components/contacts/ContactEditButton";
import { SendEmailModal } from "@/components/common/SendEmailModal";
import { getContact } from "@/lib/services/back/contacts";
import { requireUserId } from "@/lib/api-helpers";
import type { ContactDTO } from "@/lib/dto/contact";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const { id } = await params;
  const userId = await requireUserId();
  const contact = await getContact(id, userId);
  if (!contact) return notFound();

  const emailChannel = contact.channels?.find(
    (ch) => ch.channelTypeCode === "EMAIL" || ch.value.includes("@")
  );

  // Cast for client components — dates are serialized by Next.js RSC serialization
  const contactDto = contact as unknown as ContactDTO;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {contact.firstName} {contact.lastName}
          </h1>
          {contact.roleTitle && (
            <p className="text-sm text-neutral-600 dark:text-neutral-300">{contact.roleTitle}</p>
          )}
          {contact.company ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{contact.company.name}</p>
          ) : (
            <p className="text-sm italic text-neutral-400 dark:text-neutral-500">Sans entreprise</p>
          )}
        </div>
        <div className="flex gap-2">
          <ContactEditButton contact={contactDto} />
          <SendEmailModal
            defaultTo={emailChannel?.value ?? ""}
            defaultSubject={`Relance — ${contact.firstName} ${contact.lastName}`}
            defaultText={`Bonjour ${contact.firstName},\n\nJe me permets de vous recontacter suite à nos échanges.\n\nCordialement,`}
            triggerLabel="Envoyer un email"
          />
        </div>
      </div>

      <ContactActionsSection
        contactId={contact.id}
        companyId={contact.companyId ?? undefined}
      />

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
            <div className="text-sm text-neutral-500">Aucun canal de contact.</div>
          )}
        </ul>
      </div>

      {contact.notes && (
        <div className="card">
          <h3 className="text-sm font-semibold">Notes</h3>
          <p className="whitespace-pre-line text-sm text-neutral-700 dark:text-neutral-300">
            {contact.notes}
          </p>
        </div>
      )}
    </div>
  );
}
