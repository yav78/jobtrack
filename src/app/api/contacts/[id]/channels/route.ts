import { prisma } from "@/lib/prisma";
import { contactChannelCreateSchema } from "@/lib/validators/channel";
import { jsonCreated } from "@/lib/errors/response";
import { handleRouteError, requireUserId } from "@/lib/api-helpers";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const data = contactChannelCreateSchema.parse(body);

    const contact = await prisma.contact.findFirst({
      where: { id: params.id, company: { userId } },
    });
    if (!contact) throw new Error("Not found");

    const channel = await prisma.$transaction(async (tx) => {
      if (data.isPrimary) {
        await tx.contactChannel.updateMany({
          where: { contactId: params.id, channelTypeCode: data.channelTypeCode, isPrimary: true },
          data: { isPrimary: false },
        });
      }
      return tx.contactChannel.create({
        data: { ...data, contactId: params.id },
      });
    });

    return jsonCreated(channel);
  } catch (error) {
    return handleRouteError(error);
  }
}

