import { prisma } from "@/lib/prisma";
import { contactChannelCreateSchema, contactChannelUpdateSchema } from "@/lib/validators/channel";
import { NotFound } from "@/lib/errors";
import type { z } from "zod";

type ChannelCreateInput = z.infer<typeof contactChannelCreateSchema>;
type ChannelUpdateInput = z.infer<typeof contactChannelUpdateSchema>;

export async function createChannel(contactId: string, userId: string, data: ChannelCreateInput) {
  const validatedData = contactChannelCreateSchema.parse(data);
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, company: { userId } },
  });
  if (!contact) throw NotFound("Contact not found");

  const channel = await prisma.$transaction(async (tx) => {
    if (validatedData.isPrimary) {
      await tx.contactChannel.updateMany({
        where: { contactId, channelTypeCode: validatedData.channelTypeCode, isPrimary: true },
        data: { isPrimary: false },
      });
    }
    return tx.contactChannel.create({
      data: { ...validatedData, contactId },
    });
  });

  return channel;
}

export async function updateChannel(id: string, userId: string, data: ChannelUpdateInput) {
  const validatedData = contactChannelUpdateSchema.parse(data);
  const channel = await prisma.contactChannel.findFirst({
    where: { id, contact: { company: { userId } } },
  });
  if (!channel) throw NotFound("Channel not found");

  const updated = await prisma.$transaction(async (tx) => {
    if (validatedData.isPrimary === true) {
      await tx.contactChannel.updateMany({
        where: {
          contactId: channel.contactId,
          channelTypeCode: channel.channelTypeCode,
          isPrimary: true,
          NOT: { id },
        },
        data: { isPrimary: false },
      });
    }
    return tx.contactChannel.update({
      where: { id },
      data: validatedData,
    });
  });
  return updated;
}

export async function deleteChannel(id: string, userId: string) {
  await prisma.contactChannel.delete({
    where: { id, contact: { company: { userId } } },
  });
  return { success: true };
}


