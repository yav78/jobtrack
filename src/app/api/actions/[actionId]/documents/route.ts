import { jsonCreated, jsonOk } from "@/lib/errors/response";
import { handleRouteError, requireUserId } from "@/lib/api-helpers";
import { BadRequest } from "@/lib/errors";
import {
  linkDocumentToAction,
  listDocumentsForAction,
  documentToDto,
} from "@/lib/services/back/documents";

type Params = { params: Promise<{ actionId: string }> | { actionId: string } };

async function resolveActionId(params: Params["params"]): Promise<string> {
  const resolved = params instanceof Promise ? await params : params;
  return resolved.actionId;
}

export async function GET(_: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const actionId = await resolveActionId(params);
    const documents = await listDocumentsForAction(actionId, userId);
    return jsonOk({ items: documents.map(documentToDto) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const actionId = await resolveActionId(params);
    let body: { documentId?: string };
    try {
      body = await req.json();
    } catch {
      throw BadRequest("Body JSON invalide");
    }
    if (!body.documentId) throw BadRequest("documentId requis");
    await linkDocumentToAction(actionId, body.documentId, userId);
    return jsonCreated({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
