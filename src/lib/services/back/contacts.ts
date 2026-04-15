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
  options?: { page?: number; pageSize?: number; q?: string; companyId?: string; unlinked?: boolean }
) {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 10;
  const where = {
    userId,
    ...ACTIVE,
    ...(options?.companyId ? { companyId: options.companyId } : {}),
    ...(options?.unlinked ? { companyId: null } : {}),
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
  return prisma.contact.findMany({ where: { ...ACTIVE, userId } });
}

export async function getAllContactsForExport(userId: string) {
  return prisma.contact.findMany({
    where: { ...ACTIVE, userId },
    include: { company: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createContact(userId: string, data: ContactCreateInput) {
  const { channels = [], ...contactData } = contactCreateSchema.parse(data);

  if (contactData.companyId) {
    const company = await prisma.company.findFirst({
      where: { id: contactData.companyId, userId, ...ACTIVE },
    });
    if (!company) throw NotFound("Company not found");
  }

  return prisma.$transaction(async (tx) => {
    const contact = await tx.contact.create({ data: { ...contactData, userId } });
    if (channels.length > 0) {
      await tx.contactChannel.createMany({
        data: channels.map((ch) => ({
          contactId: contact.id,
          channelTypeCode: ch.channelTypeCode,
          value: ch.value,
          isPrimary: false,
        })),
      });
    }
    return contact;
  });
}

export async function getContact(id: string, userId: string) {
  const contact = await prisma.contact.findFirst({
    where: { id, ...ACTIVE, userId },
    include: {
      channels: true,
      company: { select: { id: true, name: true } },
    },
  });
  if (!contact) throw NotFound("Contact not found");
  return contact;
}

export async function updateContact(id: string, userId: string, data: ContactUpdateInput) {
  const validatedData = contactUpdateSchema.parse(data);

  if (validatedData.companyId) {
    const company = await prisma.company.findFirst({
      where: { id: validatedData.companyId, userId, ...ACTIVE },
    });
    if (!company) throw NotFound("Company not found");
  }

  return prisma.contact.update({ where: { id, userId }, data: validatedData });
}

export async function deleteContact(id: string, userId: string) {
  const contact = await prisma.contact.findFirst({ where: { id, userId, ...ACTIVE } });
  if (!contact) throw NotFound("Contact not found");
  await prisma.contact.update({ where: { id }, data: { deletedAt: new Date() } });
  return { success: true };
}

export async function deleteManyContacts(ids: string[], userId: string) {
  await prisma.contact.updateMany({
    where: { id: { in: ids }, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return { success: true };
}
