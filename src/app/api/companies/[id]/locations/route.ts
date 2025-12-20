import { jsonCreated } from "@/lib/errors/response";
import { handleRouteError, requireUserId } from "@/lib/api-helpers";
import { createLocation } from "@/lib/services/locations";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const location = await createLocation(params.id, userId, body);
    return jsonCreated(location);
  } catch (error) {
    return handleRouteError(error);
  }
}

