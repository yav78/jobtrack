import { jsonOk } from "@/lib/errors/response";
import { handleRouteError, requireUserId } from "@/lib/api-helpers";
import { getOpportunity, updateOpportunity, deleteOpportunity } from "@/lib/services/opportunities";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const userId = await requireUserId();
    const { id } = params instanceof Promise ? await params : params;
    const opp = await getOpportunity(id, userId);
    return jsonOk(opp);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const { id } = params instanceof Promise ? await params : params;
    const updated = await updateOpportunity(id, userId, body);
    return jsonOk(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const userId = await requireUserId();
    const { id } = params instanceof Promise ? await params : params;
    const result = await deleteOpportunity(id, userId);
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

