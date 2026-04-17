import { jsonOk } from "@/lib/errors/response";
import { handleRouteError, requireJson, requireUserId } from "@/lib/api-helpers";
import { deleteLink, getLink, updateLink } from "@/lib/services/back/links";

type Params = { params: Promise<{ id: string }> | { id: string } };

async function resolveId(params: Params["params"]): Promise<string> {
  const resolved = params instanceof Promise ? await params : params;
  return resolved.id;
}

export async function GET(_: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const id = await resolveId(params);
    const link = await getLink(id, userId);
    return jsonOk(link);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    requireJson(req);
    const userId = await requireUserId();
    const id = await resolveId(params);
    const body = await req.json();
    const updated = await updateLink(id, userId, body);
    return jsonOk(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const id = await resolveId(params);
    const result = await deleteLink(id, userId);
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
