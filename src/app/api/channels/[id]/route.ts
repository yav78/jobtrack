import { prisma } from "@/lib/prisma";
import { contactChannelUpdateSchema } from "@/lib/validators/channel";
import { jsonOk } from "@/lib/errors/response";
import { handleRouteError, requireUserId } from "@/lib/api-helpers";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const data = contactChannelUpdateSchema.parse(body);

    const channel = await prisma.contactChannel.findFirst({
      where: { id: params.id, contact: { company: { userId } } },
    });
    if (!channel) throw new Error("Not found");

    const updated = await prisma.$transaction(async (tx) => {
      if (data.isPrimary === true) {
        await tx.contactChannel.updateMany({
          where: {
            contactId: channel.contactId,
            channelTypeCode: channel.channelTypeCode,
            isPrimary: true,
            NOT: { id: params.id },
          },
          data: { isPrimary: false },
        });
      }
      return tx.contactChannel.update({
        where: { id: params.id },
        data,
      });
    });
    return jsonOk(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    await prisma.contactChannel.delete({
      where: { id: params.id, contact: { company: { userId } } },
    });
    return jsonOk({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

