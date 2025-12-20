import { jsonOk } from "@/lib/errors/response";
import { handleRouteError, requireUserId } from "@/lib/api-helpers";
import { updateChannel, deleteChannel } from "@/lib/services/channels";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const updated = await updateChannel(params.id, userId, body);
    return jsonOk(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const result = await deleteChannel(params.id, userId);
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

