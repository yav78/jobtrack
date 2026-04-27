import { jsonOk } from "@/lib/errors/response";
import { handleRouteError, requireJson, requireUserId } from "@/lib/api-helpers";
import {
  deleteOpportunityAction,
  updateOpportunityAction,
  getOpportunityActionById,
} from "@/lib/services/back/opportunity-actions";
import { opportunityActionUpdateSchema } from "@/lib/validators/opportunity-action";
import { prisma } from "@/lib/prisma";
import { actionToDto } from "../route";

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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ actionId: string }> | { actionId: string } }
) {
  try {
    const userId = await requireUserId();
    const resolved = params instanceof Promise ? await params : params;
    const actionId = resolved?.actionId;

    if (!actionId) {
      return handleRouteError(new Error("Action ID is required"));
    }

    requireJson(req);
    const body = await req.json();
    const validatedData = opportunityActionUpdateSchema.parse(body);

    if (validatedData.companyId !== undefined && validatedData.companyId !== null) {
      const company = await prisma.company.findFirst({
        where: { id: validatedData.companyId, userId },
      });
      if (!company) {
        return handleRouteError(new Error("Company not found"));
      }
    }

    if (validatedData.contactId !== undefined && validatedData.contactId !== null) {
      const contact = await prisma.contact.findFirst({
        where: { id: validatedData.contactId, userId },
      });
      if (!contact) {
        return handleRouteError(new Error("Contact not found"));
      }
    }

    if (validatedData.participantContactIds && validatedData.participantContactIds.length > 0) {
      const contacts = await prisma.contact.findMany({
        where: {
          id: { in: validatedData.participantContactIds },
          userId,
        },
      });
      if (contacts.length !== validatedData.participantContactIds.length) {
        return handleRouteError(new Error("Some contacts not found"));
      }
    }

    await updateOpportunityAction(actionId, userId, validatedData);

    const updated = await getOpportunityActionById(actionId, userId);
    if (!updated) {
      return handleRouteError(new Error("Action not found"));
    }

    return jsonOk(actionToDto(updated));
  } catch (error) {
    return handleRouteError(error);
  }
}
