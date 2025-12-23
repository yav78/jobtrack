import { jsonOk } from "@/lib/errors/response";
import { handleRouteError, requireUserId } from "@/lib/api-helpers";
import { addContactsToEntretien, removeContactFromEntretien } from "@/lib/services/entretien-contacts";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const { id } = params instanceof Promise ? await params : params;
    const contactIds = (body?.contactIds as string[] | undefined) ?? [];
    const result = await addContactsToEntretien(id, userId, contactIds);
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get("contactId");
    if (!contactId) throw new Error("contactId required");
    const { id } = params instanceof Promise ? await params : params;
    const result = await removeContactFromEntretien(id, userId, contactId);
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

