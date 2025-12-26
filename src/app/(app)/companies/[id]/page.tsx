"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Tabs } from "@/components/common/Tabs";
import { LocationForm } from "@/components/companies/LocationForm";
import type { CompanyDTO, LocationDTO } from "@/lib/dto/company";
import type { ContactDTO } from "@/lib/dto/contact";
import companyService from "@/lib/services/front/company.service";
import { useCompanyTypes } from "@/hooks/useCompanyTypes";

export default function CompanyDetail() {
  const params = useParams();
  const id = params.id as string;
  const [company, setCompany] = useState<(CompanyDTO & { locations?: LocationDTO[]; contacts?: ContactDTO[] }) | null>(null);
  const [activeTab, setActiveTab] = useState("locations");
  const [loading, setLoading] = useState(true);
  const { getLabel } = useCompanyTypes();

  useEffect(() => {
    async function loadCompany() {
      const data = await companyService.detail(id);
      setCompany(data);
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
          tabs={[{ key: "locations", label: "Lieux" }, { key: "contacts", label: "Contacts" }]}
          activeKey={activeTab}
          onChange={setActiveTab}
        />
        {activeTab === "locations" && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Lieux</h3>
              <ul className="space-y-2 text-sm">
                {company.locations?.length ? (
                  company.locations.map((loc: LocationDTO) => (
                    <li key={loc.id} className="rounded border border-neutral-200 p-2 dark:border-neutral-800">
                      <div className="font-medium">
                        {loc.label} {loc.isPrimary ? "(principal)" : ""}
                      </div>
                      <div className="text-neutral-600 dark:text-neutral-300">
                        {loc.addressLine1}, {loc.zipCode} {loc.city}, {loc.country}
                      </div>
                    </li>
                  ))
                ) : (
                  <div className="text-neutral-500">Aucun lieu</div>
                )}
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Ajouter un lieu</h3>
              <LocationForm companyId={company.id} />
            </div>
          </div>
        )}
        {activeTab === "contacts" && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Contacts</h3>
            <ul className="space-y-2 text-sm">
              {company.contacts?.length ? (
                company.contacts.map((contact: ContactDTO) => (
                  <li key={contact.id} className="rounded border border-neutral-200 p-2 dark:border-neutral-800">
                    <div className="font-medium">
                      {contact.firstName} {contact.lastName}
                    </div>
                    {contact.roleTitle && (
                      <div className="text-neutral-600 dark:text-neutral-300">{contact.roleTitle}</div>
                    )}
                  </li>
                ))
              ) : (
                <div className="text-neutral-500">Aucun contact</div>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
