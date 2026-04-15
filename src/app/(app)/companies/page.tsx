import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { CompanyDTO } from "@/lib/dto/company";
import { getCompanies } from "@/lib/services/back/companies";
import CompaniesPageClient from "./CompaniesPageClient";

function toCompanyDTOs(
  items: Awaited<ReturnType<typeof getCompanies>>["items"]
): CompanyDTO[] {
  return items.map((c) => ({
    id: c.id,
    name: c.name,
    typeCode: c.typeCode,
    website: c.website,
    notes: c.notes,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));
}

export default async function CompaniesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { items } = await getCompanies(session.user.id, { page: 1, pageSize: 100 });

  return <CompaniesPageClient initialCompanies={toCompanyDTOs(items)} />;
}
