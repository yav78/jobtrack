import { jsonOk } from "@/lib/errors/response";
import { handleRouteError, requireUserId } from "@/lib/api-helpers";
import { deleteOpportunityAction } from "@/lib/services/back/opportunity-actions";

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string; actionId: string }> | { id: string; actionId: string } }
) {
  try {
    const userId = await requireUserId();
    const { id, actionId } = params instanceof Promise ? await params : params;

    if (!id || !actionId) {
      return handleRouteError(new Error("Opportunity ID and Action ID are required"));
    }

    await deleteOpportunityAction(actionId, userId);
    return jsonOk({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

