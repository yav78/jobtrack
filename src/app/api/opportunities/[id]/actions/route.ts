import { jsonCreated, jsonOk } from "@/lib/errors/response";
import { handleRouteError, requireUserId } from "@/lib/api-helpers";
import { getOpportunityActions, createOpportunityAction } from "@/lib/services/back/opportunity-actions";
import { opportunityActionCreateSchema } from "@/lib/validators/opportunity-action";
import { prisma } from "@/lib/prisma";
import { NotFound } from "@/lib/errors";
import type { OpportunityActionType } from "@prisma/client";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as OpportunityActionType | null;
    const { id } = params instanceof Promise ? await params : params;
    
    if (!id) {
      throw NotFound("Opportunity ID is required");
    }

    // Vérifier que l'opportunité appartient à l'utilisateur
    const opportunity = await prisma.workOpportunity.findFirst({
      where: { id, userId },
    });
    if (!opportunity) {
      throw NotFound("Opportunity not found");
    }

    const actions = await getOpportunityActions(id, userId, type ? { type } : undefined);

    // Transformer en DTO
    const items = actions.map((action) => ({
      id: action.id,
      occurredAt: action.occurredAt.toISOString(),
      type: action.type,
      notes: action.notes,
      metadata: action.metadata as Record<string, unknown> | null,
      channelTypeCode: action.channelTypeCode,
      userId: action.userId,
      workOpportunityId: action.workOpportunityId,
      contactChannelId: action.contactChannelId,
      createdAt: action.createdAt.toISOString(),
      updatedAt: action.updatedAt.toISOString(),
      contactChannel: action.contactChannel
        ? {
            id: action.contactChannel.id,
            value: action.contactChannel.value,
            label: action.contactChannel.label,
          }
        : undefined,
      participants: action.participants.map((p) => ({
        contactId: p.contactId,
        contact: {
          id: p.contact.id,
          firstName: p.contact.firstName,
          lastName: p.contact.lastName,
        },
      })),
    }));

    return jsonOk({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const { id } = params instanceof Promise ? await params : params;
    
    if (!id) {
      return handleRouteError(new Error("Opportunity ID is required"));
    }

    // Vérifier que l'opportunité appartient à l'utilisateur
    const opportunity = await prisma.workOpportunity.findFirst({
      where: { id, userId },
    });
    if (!opportunity) {
      return handleRouteError(new Error("Opportunity not found"));
    }

    // Valider les données
    const validatedData = opportunityActionCreateSchema.parse({
      ...body,
      // S'assurer que workOpportunityId correspond à l'URL
    });

    // Vérifier le contactChannel si fourni
    if (validatedData.contactChannelId) {
      const channel = await prisma.contactChannel.findFirst({
        where: {
          id: validatedData.contactChannelId,
          contact: {
            company: {
              userId,
            },
          },
        },
      });
      if (!channel) {
        return handleRouteError(new Error("Contact channel not found"));
      }
    }

    // Vérifier les participants si fournis
    if (validatedData.participantContactIds && validatedData.participantContactIds.length > 0) {
      const contacts = await prisma.contact.findMany({
        where: {
          id: { in: validatedData.participantContactIds },
          company: { userId },
        },
      });
      if (contacts.length !== validatedData.participantContactIds.length) {
        return handleRouteError(new Error("Some contacts not found"));
      }
    }

    // Créer l'action
    const action = await createOpportunityAction(userId, {
      ...validatedData,
      workOpportunityId: id,
    });

    // Transformer en DTO
    const dto = {
      id: action.id,
      occurredAt: action.occurredAt.toISOString(),
      type: action.type,
      notes: action.notes,
      metadata: action.metadata as Record<string, unknown> | null,
      channelTypeCode: action.channelTypeCode,
      userId: action.userId,
      workOpportunityId: action.workOpportunityId,
      contactChannelId: action.contactChannelId,
      createdAt: action.createdAt.toISOString(),
      updatedAt: action.updatedAt.toISOString(),
      contactChannel: action.contactChannel
        ? {
            id: action.contactChannel.id,
            value: action.contactChannel.value,
            label: action.contactChannel.label,
          }
        : undefined,
      participants: action.participants.map((p) => ({
        contactId: p.contactId,
        contact: {
          id: p.contact.id,
          firstName: p.contact.firstName,
          lastName: p.contact.lastName,
        },
      })),
    };

    return jsonCreated(dto);
  } catch (error) {
    return handleRouteError(error);
  }
}

