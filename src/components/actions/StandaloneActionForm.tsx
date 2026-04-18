"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/common/Modal";
import { pushToast } from "@/components/common/Toast";
import type { OpportunityActionType } from "@prisma/client";
import type { ContactDTO } from "@/lib/dto/contact";
import type { ChannelTypeDTO } from "@/lib/dto/channel";
import type { OpportunityActionDTO } from "@/lib/dto/opportunity-action";
import companyService from "@/lib/services/front/company.service";
import contactService from "@/lib/services/front/contact.service";
import channelTypeService from "@/lib/services/front/channel-type.service";
import opportunityActionService from "@/lib/services/front/opportunity-action.service";
import opportunityService from "@/lib/services/front/opportunity.service";
import type { WorkOpportunityDTO } from "@/lib/dto/opportunity";
import { OpportunityForm } from "@/components/opportunities/OpportunityForm";
import { ActionDocumentPicker } from "@/components/documents/ActionDocumentPicker";
import { ContactForm } from "@/components/contacts/ContactForm";
import { CompanyQuickCreateModal } from "@/components/companies/CompanyQuickCreateModal";

const ACTION_TYPES: Array<{ value: OpportunityActionType; label: string }> = [
  { value: "INTERVIEW", label: "Entretien" },
  { value: "APPLIED", label: "Candidature" },
  { value: "INBOUND_CONTACT", label: "Contact entrant" },
  { value: "OUTBOUND_CONTACT", label: "Contact sortant" },
  { value: "MESSAGE", label: "Message" },
  { value: "CALL", label: "Appel" },
  { value: "FOLLOW_UP", label: "Relance" },
  { value: "OFFER_RECEIVED", label: "Offre reçue" },
  { value: "OFFER_ACCEPTED", label: "Offre acceptée" },
  { value: "REJECTED", label: "Refus" },
  { value: "NOTE", label: "Note" },
];

type CompanyOption = { id: string; name: string };

type Props = {
  open: boolean;
  onClose: () => void;
  /** Contact pré-sélectionné (ex. depuis la page contact) */
  defaultContactId?: string;
  defaultCompanyId?: string;
  /** Opportunité pré-sélectionnée (création d'action liée à une opportunité) */
  defaultWorkOpportunityId?: string;
  /** Appelé après création ou mise à jour réussie */
  onSuccess?: (action: OpportunityActionDTO) => void;
  /** Mode édition : id de l’action à modifier */
  actionId?: string;
  /** Données initiales pour pré-remplir le formulaire (mode édition) */
  initialData?: OpportunityActionDTO;
};

async function fetchCompanies(): Promise<CompanyOption[]> {
  try {
    return await companyService.list();
  } catch {
    return [];
  }
}

async function fetchAllContacts(): Promise<ContactDTO[]> {
  try {
    return await contactService.listAll(300);
  } catch {
    return [];
  }
}

async function fetchContactsByCompany(companyId: string): Promise<ContactDTO[]> {
  try {
    return await contactService.listByCompany(companyId);
  } catch {
    return [];
  }
}

async function fetchChannelTypes(): Promise<ChannelTypeDTO[]> {
  try {
    return await channelTypeService.list();
  } catch {
    return [];
  }
}

export function StandaloneActionForm({
  open,
  onClose,
  defaultContactId,
  defaultCompanyId,
  defaultWorkOpportunityId,
  onSuccess,
  actionId: editActionId,
  initialData,
}: Props) {
  const isEdit = Boolean(editActionId && initialData);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [allContacts, setAllContacts] = useState<ContactDTO[]>([]);
  const [contactsByCompany, setContactsByCompany] = useState<ContactDTO[]>([]);
  const [channelTypes, setChannelTypes] = useState<ChannelTypeDTO[]>([]);
  const [opportunities, setOpportunities] = useState<WorkOpportunityDTO[]>([]);
  const [showOpportunityModal, setShowOpportunityModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [form, setForm] = useState({
    type: "OUTBOUND_CONTACT" as OpportunityActionType,
    occurredAt: new Date().toISOString().slice(0, 16),
    notes: "",
    channelTypeCode: "",
    contactId: "" as string,
    companyId: "" as string,
    workOpportunityId: "" as string,
    participantContactIds: [] as string[],
  });

  useEffect(() => {
    if (open) {
      fetchCompanies().then(setCompanies);
      fetchAllContacts().then(setAllContacts);
      fetchChannelTypes().then(setChannelTypes);
      opportunityService.listAll().then(setOpportunities).catch(() => {});
      if (initialData) {
        const d = new Date(initialData.occurredAt);
        const pad = (n: number) => String(n).padStart(2, "0");
        const occurredAtLocal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setForm({
          type: initialData.type,
          occurredAt: occurredAtLocal,
          notes: initialData.notes ?? "",
          channelTypeCode: initialData.channelTypeCode ?? "",
          contactId: initialData.contactId ?? "",
          companyId: initialData.companyId ?? "",
          workOpportunityId: initialData.workOpportunityId ?? "",
          participantContactIds:
            initialData.participants?.map((p) => p.contactId) ?? [],
        });
      } else if (defaultContactId) {
        setForm((f) => ({
          ...f,
          contactId: defaultContactId,
          companyId: defaultCompanyId ?? f.companyId,
          workOpportunityId: defaultWorkOpportunityId ?? "",
          participantContactIds: [defaultContactId],
        }));
      } else {
        setForm((f) => ({
          ...f,
          contactId: "",
          companyId: "",
          workOpportunityId: defaultWorkOpportunityId ?? "",
          participantContactIds: [],
        }));
      }
    }
  }, [open, defaultContactId, defaultCompanyId, defaultWorkOpportunityId, initialData]);

  useEffect(() => {
    if (open && form.companyId) {
      fetchContactsByCompany(form.companyId).then(setContactsByCompany);
    } else {
      setContactsByCompany([]);
      setForm((f) => ({ ...f, participantContactIds: f.contactId ? [f.contactId] : [] }));
    }
  }, [open, form.companyId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        type: form.type,
        occurredAt: new Date(form.occurredAt).toISOString(),
        notes: form.notes || undefined,
        channelTypeCode: form.channelTypeCode || undefined,
        contactId: form.contactId || undefined,
        companyId: form.companyId || undefined,
        workOpportunityId: form.workOpportunityId || undefined,
        participantContactIds:
          form.participantContactIds.length > 0 ? form.participantContactIds : undefined,
      };
      const data =
        isEdit && editActionId
          ? await opportunityActionService.updateStandalone(editActionId, payload)
          : await opportunityActionService.createStandalone(payload);
      pushToast({ type: "success", title: isEdit ? "Action modifiée" : "Action créée" });
      onSuccess?.(data);
      setForm({
        type: "OUTBOUND_CONTACT",
        occurredAt: new Date().toISOString().slice(0, 16),
        notes: "",
        channelTypeCode: "",
        contactId: "",
        companyId: "",
        workOpportunityId: "",
        participantContactIds: [],
      });
      onClose();
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      pushToast({ type: "error", title: "Erreur", description: message });
    } finally {
      setLoading(false);
    }
  };

  const toggleParticipant = (contactId: string) => {
    setForm((f) => {
      const exists = f.participantContactIds.includes(contactId);
      const participantContactIds = exists
        ? f.participantContactIds.filter((id) => id !== contactId)
        : [...f.participantContactIds, contactId];
      return { ...f, participantContactIds };
    });
  };

  const onContactSelect = (contactId: string) => {
    const contact = allContacts.find((c) => c.id === contactId);
    setForm((f) => ({
      ...f,
      contactId,
      companyId: contact?.companyId ?? f.companyId,
      participantContactIds: contactId
        ? [contactId, ...f.participantContactIds.filter((id) => id !== contactId)]
        : [],
    }));
  };

  function handleOpportunityCreated(opp: WorkOpportunityDTO) {
    setOpportunities((prev) => [opp, ...prev]);
    setForm((f) => ({ ...f, workOpportunityId: opp.id }));
    setShowOpportunityModal(false);
  }

  function handleContactCreated(contact: ContactDTO) {
    setAllContacts((prev) => [contact, ...prev]);
    onContactSelect(contact.id);
    setShowContactModal(false);
  }

  function handleCompanyCreated(company: { id: string; name: string }) {
    setCompanies((prev) => [...prev, company]);
    setForm((f) => ({ ...f, companyId: company.id }));
  }

  const modalTitle = isEdit ? "Modifier l'action" : "Nouvelle action (prise de contact)";

  return (
    <Modal open={open} title={modalTitle} onClose={onClose}>
      <>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Avec quel contact ? (action entre vous et un contact)</label>
              <button
                type="button"
                onClick={() => setShowContactModal(true)}
                className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                + Créer
              </button>
            </div>
            <select
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              value={form.contactId}
              onChange={(e) => onContactSelect(e.target.value)}
            >
              <option value="">Aucun</option>
              {allContacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                  {c.company?.name ? ` — ${c.company.name}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Opportunité (optionnel)</label>
              <button
                type="button"
                onClick={() => setShowOpportunityModal(true)}
                className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                + Créer
              </button>
            </div>
            <select
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              value={form.workOpportunityId}
              onChange={(e) => setForm({ ...form, workOpportunityId: e.target.value })}
            >
              <option value="">Aucune</option>
              {opportunities.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}{o.company?.name ? ` — ${o.company.name}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Type</label>
            <select
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as OpportunityActionType })}
              required
            >
              {ACTION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Date et heure</label>
            <input
              type="datetime-local"
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              value={form.occurredAt}
              onChange={(e) => setForm({ ...form, occurredAt: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Entreprise (optionnel)</label>
              <button
                type="button"
                onClick={() => setShowCompanyModal(true)}
                className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                + Créer
              </button>
            </div>
            <select
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              value={form.companyId}
              onChange={(e) => setForm({ ...form, companyId: e.target.value })}
            >
              <option value="">Aucune</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {contactsByCompany.length > 0 && (
            <div className="space-y-1">
              <label className="text-sm font-medium">Autres participants (optionnel)</label>
              <div className="max-h-32 space-y-1 overflow-y-auto rounded border border-neutral-300 p-2 dark:border-neutral-700">
                {contactsByCompany.map((contact) => (
                  <label key={contact.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.participantContactIds.includes(contact.id)}
                      onChange={() => toggleParticipant(contact.id)}
                    />
                    <span>
                      {contact.firstName} {contact.lastName}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium">Type de canal (optionnel)</label>
            <select
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              value={form.channelTypeCode}
              onChange={(e) => setForm({ ...form, channelTypeCode: e.target.value })}
            >
              <option value="">Aucun</option>
              {channelTypes.map((channelType) => (
                <option key={channelType.code} value={channelType.code}>
                  {channelType.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Notes (optionnel)</label>
            <textarea
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
            />
          </div>

          {editActionId && (
            <div className="border-t border-neutral-200 pt-4 dark:border-neutral-700">
              <h3 className="mb-2 text-sm font-medium">Documents liés</h3>
              <ActionDocumentPicker actionId={editActionId} />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "En cours..." : isEdit ? "Enregistrer" : "Créer"}
            </button>
          </div>
        </form>

        <Modal
          open={showOpportunityModal}
          title="Nouvelle opportunité"
          onClose={() => setShowOpportunityModal(false)}
        >
          <OpportunityForm onSuccess={handleOpportunityCreated} />
        </Modal>
        <Modal
          open={showContactModal}
          title="Nouveau contact"
          onClose={() => setShowContactModal(false)}
        >
          <ContactForm onSuccess={handleContactCreated} />
        </Modal>
        <CompanyQuickCreateModal
          open={showCompanyModal}
          onClose={() => setShowCompanyModal(false)}
          onSuccess={handleCompanyCreated}
        />
      </>
    </Modal>
  );
}
