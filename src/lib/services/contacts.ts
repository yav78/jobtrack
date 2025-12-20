import { prisma } from "@/lib/prisma";
import { contactCreateSchema, contactUpdateSchema } from "@/lib/validators/contact";
import type { z } from "zod";

type ContactCreateInput = z.infer<typeof contactCreateSchema>;
type ContactUpdateInput = z.infer<typeof contactUpdateSchema>;

export async function getContacts(
  userId: string,
  options?: { page?: number; pageSize?: number; q?: string; companyId?: string }
) {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 10;
  const where = {
    company: { userId },
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
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.contact.count({ where }),
  ]);
  return { items, page, pageSize, total };
}

export async function createContact(userId: string, data: ContactCreateInput) {
  const validatedData = contactCreateSchema.parse(data);
  // Ensure company belongs to user
  const company = await prisma.company.findFirst({ where: { id: validatedData.companyId, userId } });
  if (!company) throw new Error("Not found");
  const contact = await prisma.contact.create({ data: validatedData });
  return contact;
}

export async function getContact(id: string, userId: string) {
  const contact = await prisma.contact.findFirst({
    where: { id, company: { userId } },
    include: { channels: true },
  });
  if (!contact) throw new Error("Not found");
  return contact;
}

export async function updateContact(id: string, userId: string, data: ContactUpdateInput) {
  const validatedData = contactUpdateSchema.parse(data);
  const updated = await prisma.contact.update({
    where: { id, company: { userId } },
    data: validatedData,
  });
  return updated;
}

export async function deleteContact(id: string, userId: string) {
  await prisma.contact.delete({ where: { id, company: { userId } } });
  return { success: true };
}


