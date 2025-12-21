import { unstable_cache as cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";

export const getCompanyTypes = cache(
  async () => prisma.companyType.findMany({ orderBy: { code: "asc" } }),
  ["companyTypes"],
  { revalidate: 60 * 60, tags: ["refdata"] }
);

export async function updateCompanyType(code: string, data: { label: string }) {
  const updated = await prisma.companyType.update({
    where: { code },
    data,
  });
  revalidateTag("refdata", "companyTypes");
  return updated;
}

export async function createCompanyType(data: { code: string; label: string }) {
  const created = await prisma.companyType.create({ data });
  revalidateTag("refdata", "companyTypes");
  return created;
}

export async function deleteCompanyType(code: string) {
  await prisma.companyType.delete({ where: { code } });
  revalidateTag("refdata", "companyTypes");
}

