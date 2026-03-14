"use client";

import { SendEmailModal } from "@/components/common/SendEmailModal";

type Props = {
  opportunityTitle: string;
  companyName?: string;
};

export function OpportunityEmailButton({ opportunityTitle, companyName }: Props) {
  const subject = companyName
    ? `Relance — ${opportunityTitle} chez ${companyName}`
    : `Relance — ${opportunityTitle}`;

  const text = companyName
    ? `Bonjour,\n\nJe me permets de revenir vers vous concernant ma candidature pour le poste « ${opportunityTitle} » au sein de ${companyName}.\n\nCordialement,`
    : `Bonjour,\n\nJe me permets de revenir vers vous concernant ma candidature pour le poste « ${opportunityTitle} ».\n\nCordialement,`;

  return (
    <SendEmailModal
      defaultSubject={subject}
      defaultText={text}
      triggerLabel="Envoyer un email de relance"
    />
  );
}
