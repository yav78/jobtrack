import { prisma } from "@/lib/prisma";
import { companyCreateSchema, companyUpdateSchema } from "@/lib/validators/company";
import { NotFound } from "@/lib/errors";
import type { z } from "zod";
import { requireUserId } from "../../api-helpers";

type CompanyCreateInput = z.infer<typeof companyCreateSchema>;
type CompanyUpdateInput = z.infer<typeof companyUpdateSchema>;

const ACTIVE = { deletedAt: null } as const;

export async function getCompanies(userId: string, options?: { page?: number; pageSize?: number; q?: string }) {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 10;
  const where = {
    userId,
    ...ACTIVE,
    ...(options?.q ? { name: { contains: options.q, mode: "insensitive" as const } } : {}),
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
  return prisma.company.findMany({
    where: { userId, ...ACTIVE },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllCompaniesForExport(userId: string) {
  return prisma.company.findMany({
    where: { userId, ...ACTIVE },
    include: { companyType: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCompany(userId: string, data: CompanyCreateInput) {
  const validatedData = companyCreateSchema.parse(data);
  return prisma.company.create({ data: { ...validatedData, userId } });
}

export async function getCompany(id: string, userId: string) {
  const company = await prisma.company.findFirst({
    where: { id, userId, ...ACTIVE },
    include: {
      locations: true,
      contacts: { where: { ...ACTIVE } },
    },
  });
  if (!company) throw NotFound("Company not found");
  return company;
}

export async function updateCompany(id: string, userId: string, data: CompanyUpdateInput) {
  const validatedData = companyUpdateSchema.parse(data);
  return prisma.company.update({ where: { id, userId }, data: validatedData });
}

export async function deleteCompany(id: string, userId: string) {
  const now = new Date();
  await prisma.$transaction([
    prisma.contact.updateMany({ where: { companyId: id, deletedAt: null }, data: { deletedAt: now } }),
    prisma.company.update({ where: { id, userId }, data: { deletedAt: now } }),
  ]);
  return { success: true };
}

export async function deleteManyCompanies(ids: string[], userId: string) {
  const now = new Date();
  await prisma.$transaction([
    prisma.contact.updateMany({ where: { companyId: { in: ids }, deletedAt: null }, data: { deletedAt: now } }),
    prisma.company.updateMany({ where: { id: { in: ids }, userId, deletedAt: null }, data: { deletedAt: now } }),
  ]);
  return { success: true };
}
