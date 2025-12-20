import { prisma } from "@/lib/prisma";

export async function addContactsToEntretien(entretienId: string, userId: string, contactIds: string[]) {
  if (!contactIds.length) throw new Error("No contactIds");

  const entretien = await prisma.entretien.findFirst({
    where: { id: entretienId, userId },
  });
  if (!entretien) throw new Error("Not found");

  await prisma.entretienContact.createMany({
    data: contactIds.map((cid) => ({ entretienId, contactId: cid })),
    skipDuplicates: true,
  });
  return { success: true };
}

export async function removeContactFromEntretien(entretienId: string, userId: string, contactId: string) {
  const entretien = await prisma.entretien.findFirst({
    where: { id: entretienId, userId },
  });
  if (!entretien) throw new Error("Not found");

  await prisma.entretienContact.delete({
    where: { entretienId_contactId: { entretienId, contactId } },
  });
  return { success: true };
}


