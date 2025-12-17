import { prisma } from "@/lib/prisma";
import { contactUpdateSchema } from "@/lib/validators/contact";
import { jsonOk } from "@/lib/errors/response";
import { handleRouteError, requireUserId } from "@/lib/api-helpers";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const contact = await prisma.contact.findFirst({
      where: { id: params.id, company: { userId } },
      include: { channels: true },
    });
    if (!contact) throw new Error("Not found");
    return jsonOk(contact);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const data = contactUpdateSchema.parse(body);
    const updated = await prisma.contact.update({
      where: { id: params.id, company: { userId } },
      data,
    });
    return jsonOk(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    await prisma.contact.delete({ where: { id: params.id, company: { userId } } });
    return jsonOk({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

