import { jsonOk } from "@/lib/errors/response";
import { handleRouteError, requireUserId } from "@/lib/api-helpers";
import { getOpportunity, updateOpportunity, deleteOpportunity } from "@/lib/services/opportunities";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const opp = await getOpportunity(params.id, userId);
    return jsonOk(opp);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const updated = await updateOpportunity(params.id, userId, body);
    return jsonOk(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const result = await deleteOpportunity(params.id, userId);
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

