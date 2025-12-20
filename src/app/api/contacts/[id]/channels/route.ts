import { jsonCreated } from "@/lib/errors/response";
import { handleRouteError, requireUserId } from "@/lib/api-helpers";
import { createChannel } from "@/lib/services/channels";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const channel = await createChannel(params.id, userId, body);
    return jsonCreated(channel);
  } catch (error) {
    return handleRouteError(error);
  }
}

