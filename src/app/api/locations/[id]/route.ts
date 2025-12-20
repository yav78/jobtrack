import { jsonError, jsonOk } from "@/lib/errors/response";
import { handleRouteError, requireUserId } from "@/lib/api-helpers";
import { updateLocation, deleteLocation } from "@/lib/services/locations";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const updated = await updateLocation(params.id, userId, body);
    return jsonOk(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const result = await deleteLocation(params.id, userId);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}

