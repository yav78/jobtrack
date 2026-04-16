import { jsonOk } from "@/lib/errors/response";
import { handleRouteError, requireUserId } from "@/lib/api-helpers";
import { unlinkDocumentFromAction } from "@/lib/services/back/documents";

type Params = {
  params:
    | Promise<{ actionId: string; documentId: string }>
    | { actionId: string; documentId: string };
};

export async function DELETE(_: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const resolved = params instanceof Promise ? await params : params;
    const { actionId, documentId } = resolved;
    await unlinkDocumentFromAction(actionId, documentId, userId);
    return jsonOk({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
