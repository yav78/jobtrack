"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Tabs } from "@/components/common/Tabs";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { pushToast } from "@/components/common/Toast";
import { LocationForm } from "@/components/companies/LocationForm";
import { LocationEditForm } from "@/components/companies/LocationEditForm";
import { ContactForm } from "@/components/companies/ContactForm";
import { ContactEditForm } from "@/components/companies/ContactEditForm";
import { LinkContactForm } from "@/components/companies/LinkContactForm";
import { CompanyEditForm } from "@/components/companies/CompanyEditForm";
import type { CompanyDTO, LocationDTO } from "@/lib/dto/company";
import type { ContactDTO } from "@/lib/dto/contact";
import companyService from "@/lib/services/front/company.service";
import { useCompanyTypes } from "@/hooks/useCompanyTypes";
import Link from "next/link";

type PendingDelete =
  | { type: "location"; id: string; label: string }
  | { type: "contact"; id: string; label: string };

export default function CompanyDetail() {
  const params = useParams();
  const id = params.id as string;
  const [company, setCompany] = useState<(CompanyDTO & { locations: LocationDTO[]; contacts?: ContactDTO[] }) | null>(null);
  const [activeTab, setActiveTab] = useState("info");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { getLabel } = useCompanyTypes();

  useEffect(() => {
    async function loadCompany() {
      try {
        setLoading(true);
        setError(null);
        const data = await companyService.detail(id);
        setCompany(data as (CompanyDTO & { locations: LocationDTO[]; contacts?: ContactDTO[] }) | null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors du chargement.");
      } finally {
        setLoading(false);
      }
    }
    loadCompany();
  }, [id]);

  const handleConfirmDelete = async () => {
    if (!pendingDelete || !company) return;
    setDeleting(true);
    try {
      const url =
        pendingDelete.type === "location"
          ? `/api/locations/${pendingDelete.id}`
          : `/api/contacts/${pendingDelete.id}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la suppression");

      if (pendingDelete.type === "location") {
        setCompany({ ...company, locations: company.locations.filter((l) => l.id !== pendingDelete.id) });
        pushToast({ type: "success", title: "Lieu supprimé" });
      } else {
        setCompany({ ...company, contacts: (company.contacts ?? []).filter((c) => c.id !== pendingDelete.id) });
        pushToast({ type: "success", title: "Contact supprimé" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      pushToast({ type: "error", title: "Erreur suppression", description: message });
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="card space-y-3">
          <div className="h-6 w-64 rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-4 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
        {error}
      </div>
    );
  }

  if (!company) {
    return <div className="space-y-4 text-sm text-neutral-500">Entreprise non trouvée.</div>;
  }

  return (
    <div className="space-y-4">
      <ConfirmDialog
        open={!!pendingDelete}
        title={pendingDelete?.type === "location" ? "Supprimer ce lieu ?" : "Supprimer ce contact ?"}
        description={
          pendingDelete
            ? `"${pendingDelete.label}" sera supprimé définitivement.`
            : undefined
        }
        confirmLabel={deleting ? "Suppression…" : "Supprimer"}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

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
            { key: "locations", label: `Lieux (${company.locations?.length ?? 0})` },
            { key: "contacts", label: `Contacts (${company.contacts?.length ?? 0})` },
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
                  <span className="font-medium text-neutral-600 dark:text-neutral-400">Nom :</span>{" "}
                  <span className="text-neutral-900 dark:text-neutral-100">{company.name}</span>
                </div>
                <div>
                  <span className="font-medium text-neutral-600 dark:text-neutral-400">Type :</span>{" "}
                  <span className="text-neutral-900 dark:text-neutral-100">{getLabel(company.typeCode)}</span>
                </div>
                {company.website && (
                  <div>
                    <span className="font-medium text-neutral-600 dark:text-neutral-400">Site web :</span>{" "}
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
                    <span className="font-medium text-neutral-600 dark:text-neutral-400">Notes :</span>
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
                  setCompany({ ...company, ...updatedCompany });
                }}
              />
            </div>
          </div>
        )}

        {activeTab === "locations" && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Lieux</h3>
              {company.locations?.length ? (
                <ul className="space-y-2 text-sm">
                  {company.locations.map((loc: LocationDTO) => (
                    <li key={loc.id} className="rounded border border-neutral-200 p-2 dark:border-neutral-800">
                      {editingLocationId === loc.id ? (
                        <LocationEditForm
                          location={loc}
                          onSuccess={(updatedLocation: LocationDTO) => {
                            setCompany({
                              ...company,
                              locations: company.locations.map((l) =>
                                l.id === loc.id ? updatedLocation : l
                              ),
                            });
                            setEditingLocationId(null);
                          }}
                          onCancel={() => setEditingLocationId(null)}
                        />
                      ) : (
                        <>
                          <div className="font-medium">
                            {loc.label}{loc.isPrimary && <span className="ml-1 text-xs text-emerald-600 dark:text-emerald-400">(principal)</span>}
                          </div>
                          <div className="text-neutral-600 dark:text-neutral-300">
                            {loc.addressLine1}, {loc.zipCode} {loc.city}, {loc.country}
                          </div>
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              aria-label={`Modifier le lieu ${loc.label}`}
                              onClick={() => setEditingLocationId(loc.id)}
                              className="text-xs text-emerald-600 hover:underline dark:text-emerald-400"
                            >
                              Modifier
                            </button>
                            <button
                              type="button"
                              aria-label={`Supprimer le lieu ${loc.label}`}
                              onClick={() => setPendingDelete({ type: "location", id: loc.id, label: loc.label })}
                              className="text-xs text-red-600 hover:underline dark:text-red-400"
                            >
                              Supprimer
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-neutral-500">
                  Aucun lieu enregistré. Utilisez le formulaire ci-contre pour en ajouter un.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Ajouter un lieu</h3>
              <LocationForm
                companyId={company.id}
                onSuccess={(location: LocationDTO) => {
                  setCompany({ ...company, locations: [...company.locations, location] });
                }}
              />
            </div>
          </div>
        )}

        {activeTab === "contacts" && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Contacts</h3>
              {company.contacts?.length ? (
                <ul className="space-y-2 text-sm">
                  {company.contacts.map((contact: ContactDTO) => (
                    <li key={contact.id} className="rounded border border-neutral-200 p-2 dark:border-neutral-800">
                      {editingContactId === contact.id ? (
                        <ContactEditForm
                          contact={contact}
                          onSuccess={(updatedContact: ContactDTO) => {
                            setCompany({
                              ...company,
                              contacts: (company.contacts ?? []).map((c) =>
                                c.id === contact.id ? updatedContact : c
                              ),
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
                              type="button"
                              aria-label={`Modifier ${contact.firstName} ${contact.lastName}`}
                              onClick={() => setEditingContactId(contact.id)}
                              className="text-xs text-emerald-600 hover:underline dark:text-emerald-400"
                            >
                              Modifier
                            </button>
                            <button
                              type="button"
                              aria-label={`Supprimer ${contact.firstName} ${contact.lastName}`}
                              onClick={() =>
                                setPendingDelete({
                                  type: "contact",
                                  id: contact.id,
                                  label: `${contact.firstName} ${contact.lastName}`,
                                })
                              }
                              className="text-xs text-red-600 hover:underline dark:text-red-400"
                            >
                              Supprimer
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-neutral-500">
                  Aucun contact associé. Utilisez le formulaire ci-contre pour en ajouter un.
                </p>
              )}
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Nouveau contact</h3>
                <ContactForm
                  companyId={company.id}
                  onSuccess={(contact: ContactDTO) => {
                    setCompany({ ...company, contacts: [...(company.contacts ?? []), contact] });
                  }}
                />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Lier un contact existant</h3>
                <LinkContactForm
                  companyId={company.id}
                  onSuccess={(contact: ContactDTO) => {
                    setCompany({ ...company, contacts: [...(company.contacts ?? []), contact] });
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
