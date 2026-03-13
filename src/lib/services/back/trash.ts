import { prisma } from "@/lib/prisma";
import { NotFound } from "@/lib/errors";

export async function getTrash(userId: string) {
  const [companies, contacts, opportunities] = await Promise.all([
    prisma.company.findMany({
      where: { userId, deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.contact.findMany({
      where: { deletedAt: { not: null }, company: { userId } },
      include: { company: { select: { id: true, name: true } } },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.workOpportunity.findMany({
      where: { userId, deletedAt: { not: null } },
      include: { company: { select: { id: true, name: true } } },
      orderBy: { deletedAt: "desc" },
    }),
  ]);
  return { companies, contacts, opportunities };
}

export async function restoreCompany(id: string, userId: string) {
  const company = await prisma.company.findFirst({ where: { id, userId, deletedAt: { not: null } } });
  if (!company) throw NotFound("Company not found in trash");
  await prisma.company.update({ where: { id }, data: { deletedAt: null } });
  return { success: true };
}

export async function restoreContact(id: string, userId: string) {
  const contact = await prisma.contact.findFirst({
    where: { id, deletedAt: { not: null }, company: { userId } },
  });
  if (!contact) throw NotFound("Contact not found in trash");
  await prisma.contact.update({ where: { id }, data: { deletedAt: null } });
  return { success: true };
}

export async function restoreOpportunity(id: string, userId: string) {
  const opp = await prisma.workOpportunity.findFirst({ where: { id, userId, deletedAt: { not: null } } });
  if (!opp) throw NotFound("Opportunity not found in trash");
  await prisma.workOpportunity.update({ where: { id }, data: { deletedAt: null } });
  return { success: true };
}

export async function permanentDeleteCompany(id: string, userId: string) {
  const company = await prisma.company.findFirst({ where: { id, userId, deletedAt: { not: null } } });
  if (!company) throw NotFound("Company not found in trash");
  await prisma.company.delete({ where: { id } });
  return { success: true };
}

export async function permanentDeleteContact(id: string, userId: string) {
  const contact = await prisma.contact.findFirst({
    where: { id, deletedAt: { not: null }, company: { userId } },
  });
  if (!contact) throw NotFound("Contact not found in trash");
  await prisma.contact.delete({ where: { id } });
  return { success: true };
}

export async function permanentDeleteOpportunity(id: string, userId: string) {
  const opp = await prisma.workOpportunity.findFirst({ where: { id, userId, deletedAt: { not: null } } });
  if (!opp) throw NotFound("Opportunity not found in trash");
  await prisma.workOpportunity.delete({ where: { id } });
  return { success: true };
}
