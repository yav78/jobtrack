import { jsonOk } from "@/lib/errors/response";
import { handleRouteError, requireUserId } from "@/lib/api-helpers";
import { getEntretien, updateEntretien, deleteEntretien } from "@/lib/services/entretiens";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const userId = await requireUserId();
    const { id } = params instanceof Promise ? await params : params;
    const entretien = await getEntretien(id, userId);
    return jsonOk(entretien);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const { id } = params instanceof Promise ? await params : params;
    const updated = await updateEntretien(id, userId, body);
    return jsonOk(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const userId = await requireUserId();
    const { id } = params instanceof Promise ? await params : params;
    const result = await deleteEntretien(id, userId);
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

