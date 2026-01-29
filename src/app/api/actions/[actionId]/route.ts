import { jsonOk } from "@/lib/errors/response";
import { handleRouteError, requireUserId } from "@/lib/api-helpers";
import { deleteOpportunityAction } from "@/lib/services/back/opportunity-actions";

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ actionId: string }> | { actionId: string } }
) {
  try {
    const userId = await requireUserId();
    const resolved = params instanceof Promise ? await params : params;
    const actionId = resolved?.actionId;

    if (!actionId) {
      return handleRouteError(new Error("Action ID is required"));
    }

    await deleteOpportunityAction(actionId, userId);
    return jsonOk({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
