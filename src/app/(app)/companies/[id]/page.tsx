"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Tabs } from "@/components/common/Tabs";
import { pushToast } from "@/components/common/Toast";
import { LocationForm } from "@/components/companies/LocationForm";
import { LocationEditForm } from "@/components/companies/LocationEditForm";
import { ContactForm } from "@/components/companies/ContactForm";
import { ContactEditForm } from "@/components/companies/ContactEditForm";
import { CompanyEditForm } from "@/components/companies/CompanyEditForm";
import type { CompanyDTO, LocationDTO } from "@/lib/dto/company";
import type { ContactDTO } from "@/lib/dto/contact";
import companyService from "@/lib/services/front/company.service";
import { useCompanyTypes } from "@/hooks/useCompanyTypes";
import Link from "next/link";

export default function CompanyDetail() {
  const params = useParams();
  const id = params.id as string;
  const [company, setCompany] = useState<(CompanyDTO & { locations: LocationDTO[]; contacts?: ContactDTO[] }) | null>(null);
  const [activeTab, setActiveTab] = useState("info");
  const [loading, setLoading] = useState(true);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const { getLabel } = useCompanyTypes();

  useEffect(() => {
    async function loadCompany() {
      const data = await companyService.detail(id);
      setCompany(data as unknown as (CompanyDTO & { locations: LocationDTO[]; contacts?: ContactDTO[] }));
      setLoading(false);
    }
    loadCompany();
  }, [id]);

  if (loading) {
    return <div className="space-y-4">Chargement...</div>;
  }

  if (!company) {
    return <div className="space-y-4">Entreprise non trouvée</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{company.name}</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">Type: {getLabel(company.typeCode)}</p>
        </div>
      </div>
      <div className="card space-y-4">
        <Tabs
          tabs={[
            { key: "info", label: "Informations" },
            { key: "locations", label: "Lieux" },
            { key: "contacts", label: "Contacts" },
          ]}
          activeKey={activeTab}
          onChange={setActiveTab}
        />
        {activeTab === "info" && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Informations actuelles</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-neutral-600 dark:text-neutral-400">Nom:</span>{" "}
                  <span className="text-neutral-900 dark:text-neutral-100">{company.name}</span>
                </div>
                <div>
                  <span className="font-medium text-neutral-600 dark:text-neutral-400">Type:</span>{" "}
                  <span className="text-neutral-900 dark:text-neutral-100">{getLabel(company.typeCode)}</span>
                </div>
                {company.website && (
                  <div>
                    <span className="font-medium text-neutral-600 dark:text-neutral-400">Site web:</span>{" "}
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                      {company.website}
                    </a>
                  </div>
                )}
                {company.notes && (
                  <div>
                    <span className="font-medium text-neutral-600 dark:text-neutral-400">Notes:</span>
                    <p className="mt-1 text-neutral-700 dark:text-neutral-300 whitespace-pre-line">
                      {company.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Modifier l'entreprise</h3>
              <CompanyEditForm
                company={company}
                onSuccess={(updatedCompany: CompanyDTO) => {
                  setCompany({
                    ...company,
                    ...updatedCompany,
                  });
                }}
              />
            </div>
          </div>
        )}
        {activeTab === "locations" && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Lieux</h3>
              <ul className="space-y-2 text-sm">
                {company.locations?.length ? (
                  company.locations.map((loc: LocationDTO) => (
                    <li key={loc.id} className="rounded border border-neutral-200 p-2 dark:border-neutral-800">
                      {editingLocationId === loc.id ? (
                        <LocationEditForm
                          location={loc}
                          onSuccess={(updatedLocation: LocationDTO) => {
                            const newLocations = company.locations.map((l) =>
                              l.id === loc.id ? updatedLocation : l
                            );
                            setCompany({
                              ...company,
                              locations: newLocations,
                            });
                            setEditingLocationId(null);
                          }}
                          onCancel={() => setEditingLocationId(null)}
                        />
                      ) : (
                        <>
                          <div className="font-medium">
                            {loc.label} {loc.isPrimary ? "(principal)" : ""}
                          </div>
                          <div className="text-neutral-600 dark:text-neutral-300">
                            {loc.addressLine1}, {loc.zipCode} {loc.city}, {loc.country}
                          </div>
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => setEditingLocationId(loc.id)}
                              className="text-xs text-emerald-600 hover:underline dark:text-emerald-400"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm("Êtes-vous sûr de vouloir supprimer ce lieu ?")) {
                                  return;
                                }
                                try {
                                  const res = await fetch(`/api/locations/${loc.id}`, {
                                    method: "DELETE",
                                  });
                                  if (!res.ok) throw new Error("Erreur lors de la suppression");
                                  const newLocations = company.locations.filter((l) => l.id !== loc.id);
                                  setCompany({
                                    ...company,
                                    locations: newLocations,
                                  });
                                  pushToast({ type: "success", title: "Lieu supprimé" });
                                } catch (err) {
                                  const message = err instanceof Error ? err.message : String(err);
                                  pushToast({ type: "error", title: "Erreur suppression", description: message });
                                }
                              }}
                              className="text-xs text-red-600 hover:underline dark:text-red-400"
                            >
                              Supprimer
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  ))
                ) : (
                  <div className="text-neutral-500">Aucun lieu</div>
                )}
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Ajouter un lieu</h3>
              <LocationForm
                companyId={company.id}
                onSuccess={(location: LocationDTO) => {
                  const newLocations = [...company.locations, location];
                  setCompany({
                    ...company,
                    locations: newLocations,
                  });
                }}
              />
            </div>
          </div>
        )}
        {activeTab === "contacts" && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Contacts</h3>
              <ul className="space-y-2 text-sm">
                {company.contacts?.length ? (
                  company.contacts.map((contact: ContactDTO) => (
                    <li key={contact.id} className="rounded border border-neutral-200 p-2 dark:border-neutral-800">
                      {editingContactId === contact.id ? (
                        <ContactEditForm
                          contact={contact}
                          onSuccess={(updatedContact: ContactDTO) => {
                            const newContacts = company.contacts?.map((c) =>
                              c.id === contact.id ? updatedContact : c
                            ) || [];
                            setCompany({
                              ...company,
                              contacts: newContacts,
                            });
                            setEditingContactId(null);
                          }}
                          onCancel={() => setEditingContactId(null)}
                        />
                      ) : (
                        <>
                          <Link
                            href={`/contacts/${contact.id}`}
                            className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                          >
                            {contact.firstName} {contact.lastName}
                          </Link>
                          {contact.roleTitle && (
                            <div className="text-neutral-600 dark:text-neutral-300">{contact.roleTitle}</div>
                          )}
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => setEditingContactId(contact.id)}
                              className="text-xs text-emerald-600 hover:underline dark:text-emerald-400"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm("Êtes-vous sûr de vouloir supprimer ce contact ?")) {
                                  return;
                                }
                                try {
                                  const res = await fetch(`/api/contacts/${contact.id}`, {
                                    method: "DELETE",
                                  });
                                  if (!res.ok) throw new Error("Erreur lors de la suppression");
                                  const newContacts = company.contacts?.filter((c) => c.id !== contact.id) || [];
                                  setCompany({
                                    ...company,
                                    contacts: newContacts,
                                  });
                                  pushToast({ type: "success", title: "Contact supprimé" });
                                } catch (err) {
                                  const message = err instanceof Error ? err.message : String(err);
                                  pushToast({ type: "error", title: "Erreur suppression", description: message });
                                }
                              }}
                              className="text-xs text-red-600 hover:underline dark:text-red-400"
                            >
                              Supprimer
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  ))
                ) : (
                  <div className="text-neutral-500">Aucun contact</div>
                )}
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Ajouter un contact</h3>
              <ContactForm
                companyId={company.id}
                onSuccess={(contact: ContactDTO) => {
                  const newContacts = [...(company.contacts || []), contact];
                  setCompany({
                    ...company,
                    contacts: newContacts,
                  });
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
