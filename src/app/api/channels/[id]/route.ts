import { jsonOk } from "@/lib/errors/response";
import { handleRouteError, requireJson, requireUserId } from "@/lib/api-helpers";
import { updateChannel, deleteChannel } from "@/lib/services/back/channels";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    requireJson(req);
    const userId = await requireUserId();
    const body = await req.json();
    const { id } = params instanceof Promise ? await params : params;
    const updated = await updateChannel(id, userId, body);
    return jsonOk(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const userId = await requireUserId();
    const { id } = params instanceof Promise ? await params : params;
    const result = await deleteChannel(id, userId);
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

