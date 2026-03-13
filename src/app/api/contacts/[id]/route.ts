import { jsonOk } from "@/lib/errors/response";
import { handleRouteError, requireJson, requireUserId } from "@/lib/api-helpers";
import { getContact, updateContact, deleteContact } from "@/lib/services/back/contacts";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const userId = await requireUserId();
    const { id } = params instanceof Promise ? await params : params;
    const contact = await getContact(id, userId);
    return jsonOk(contact);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    requireJson(req);
    const userId = await requireUserId();
    const body = await req.json();
    const { id } = params instanceof Promise ? await params : params;
    const updated = await updateContact(id, userId, body);
    return jsonOk(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const userId = await requireUserId();
    const { id } = params instanceof Promise ? await params : params;
    const result = await deleteContact(id, userId);
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

