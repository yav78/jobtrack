import { requireUserId } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { contactCreateSchema, contactUpdateSchema } from "@/lib/validators/contact";
import { NotFound } from "@/lib/errors";
import type { z } from "zod";

type ContactCreateInput = z.infer<typeof contactCreateSchema>;
type ContactUpdateInput = z.infer<typeof contactUpdateSchema>;

const ACTIVE = { deletedAt: null } as const;

export async function getContacts(
  userId: string,
  options?: { page?: number; pageSize?: number; q?: string; companyId?: string }
) {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 10;
  const where = {
    ...ACTIVE,
    company: { userId, ...ACTIVE },
    ...(options?.companyId ? { companyId: options.companyId } : {}),
    ...(options?.q
      ? {
          OR: [
            { firstName: { contains: options.q, mode: "insensitive" as const } },
            { lastName: { contains: options.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      include: { company: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.contact.count({ where }),
  ]);
  return { items, page, pageSize, total };
}

export async function getAllContacts() {
  const userId = await requireUserId();
  return prisma.contact.findMany({ where: { ...ACTIVE, company: { userId, ...ACTIVE } } });
}

export async function getAllContactsForExport(userId: string) {
  return prisma.contact.findMany({
    where: { ...ACTIVE, company: { userId, ...ACTIVE } },
    include: { company: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createContact(userId: string, data: ContactCreateInput) {
  const validatedData = contactCreateSchema.parse(data);
  const company = await prisma.company.findFirst({ where: { id: validatedData.companyId, userId, ...ACTIVE } });
  if (!company) throw NotFound("Company not found");
  return prisma.contact.create({ data: validatedData });
}

export async function getContact(id: string, userId: string) {
  const contact = await prisma.contact.findFirst({
    where: { id, ...ACTIVE, company: { userId } },
    include: { channels: true },
  });
  if (!contact) throw NotFound("Contact not found");
  return contact;
}

export async function updateContact(id: string, userId: string, data: ContactUpdateInput) {
  const validatedData = contactUpdateSchema.parse(data);
  return prisma.contact.update({ where: { id, company: { userId } }, data: validatedData });
}

export async function deleteContact(id: string, userId: string) {
  const contact = await prisma.contact.findFirst({ where: { id, company: { userId }, ...ACTIVE } });
  if (!contact) throw NotFound("Contact not found");
  await prisma.contact.update({ where: { id }, data: { deletedAt: new Date() } });
  return { success: true };
}

export async function deleteManyContacts(ids: string[], userId: string) {
  await prisma.contact.updateMany({
    where: { id: { in: ids }, company: { userId }, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return { success: true };
}
