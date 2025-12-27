import { prisma } from "@/lib/prisma";
import { companyCreateSchema, companyUpdateSchema } from "@/lib/validators/company";
import type { z } from "zod";
import { requireUserId } from "../../api-helpers";

type CompanyCreateInput = z.infer<typeof companyCreateSchema>;
type CompanyUpdateInput = z.infer<typeof companyUpdateSchema>;

export async function getCompanies(userId: string, options?: { page?: number; pageSize?: number; q?: string }) {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 10;
  const where = {
    userId,
    ...(options?.q
      ? {
          name: {
            contains: options.q,
            mode: "insensitive" as const,
          },
        }
      : {}),
  };
  const [items, total] = await Promise.all([
    prisma.company.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.company.count({ where }),
  ]);
  return { items, page, pageSize, total };
}

export async function getAllCompanies() {
  const userId = await requireUserId();
  const companies = await prisma.company.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return companies;
}

export async function createCompany(userId: string, data: CompanyCreateInput) {
  const validatedData = companyCreateSchema.parse(data);
  const company = await prisma.company.create({
    data: { ...validatedData, userId },
  });
  return company;
}

export async function getCompany(id: string, userId: string) {
  const company = await prisma.company.findFirst({
    where: { id, userId },
    include: { locations: true, contacts: true },
  });
  if (!company) throw new Error("Not found");
  return company;
}

export async function updateCompany(id: string, userId: string, data: CompanyUpdateInput) {
  const validatedData = companyUpdateSchema.parse(data);
  const updated = await prisma.company.update({
    where: { id, userId },
    data: validatedData,
  });
  return updated;
}

export async function deleteCompany(id: string, userId: string) {
  await prisma.company.delete({
    where: { id, userId },
  });
  return { success: true };
}


