import { jsonCreated } from "@/lib/errors/response";
import { handleRouteError, requireJson, requireUserId } from "@/lib/api-helpers";
import { createLocation } from "@/lib/services/back/locations";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    requireJson(req);
    const userId = await requireUserId();
    const body = await req.json();
    const { id } = params instanceof Promise ? await params : params;
    const location = await createLocation(id, userId, body);
    return jsonCreated(location);
  } catch (error) {
    return handleRouteError(error);
  }
}
