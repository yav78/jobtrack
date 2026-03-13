import { handleRouteError, requireUserId } from "@/lib/api-helpers";
import { jsonOk } from "@/lib/errors/response";
import { getTrash } from "@/lib/services/back/trash";

export async function GET() {
  try {
    const userId = await requireUserId();
    const data = await getTrash(userId);
    return jsonOk(data as unknown as Record<string, unknown>);
  } catch (error) {
    return handleRouteError(error);
  }
}
