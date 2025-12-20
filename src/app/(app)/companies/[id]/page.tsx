
import { notFound } from "next/navigation";
import { Tabs } from "@/components/common/Tabs";
import { LocationForm } from "@/components/companies/LocationForm";
import type { CompanyDTO, LocationDTO } from "@/lib/dto/company";
import { getCompany } from "@/app/api/companies/[id]/route";


async function fetchCompany(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  console.log("baseUrl", baseUrl);
  const res = await fetch(`${baseUrl}/api/companies/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function CompanyDetail(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  // const { company, setCompany } = useState<CompanyDTO & { locations?: LocationDTO[] } | null>(null);
  const company: (CompanyDTO & { locations?: LocationDTO[] }) | null = await getCompany(id); // await fetchCompany(id);

  if (!company) return notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{company.name}</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">Type: {company.typeCode}</p>
        </div>
      </div>
      <div className="card space-y-4">
        <Tabs tabs={[{ key: "locations", label: "Lieux" }, { key: "contacts", label: "Contacts" }]} activeKey="locations"  />
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
      </div>
    </div>
  );
}

