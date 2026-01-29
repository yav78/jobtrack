import { jsonCreated, jsonOk } from "@/lib/errors/response";
import { handleRouteError, requireUserId } from "@/lib/api-helpers";
import { getAllActions, createOpportunityAction } from "@/lib/services/back/opportunity-actions";
import { opportunityActionCreateSchema } from "@/lib/validators/opportunity-action";
import { prisma } from "@/lib/prisma";
import type { OpportunityActionType } from "@prisma/client";

export function actionToDto(action: {
  id: string;
  occurredAt: Date;
  type: OpportunityActionType;
  notes: string | null;
  metadata: unknown;
  channelTypeCode: string | null;
  userId: string;
  workOpportunityId?: string | null;
  companyId?: string | null;
  contactId?: string | null;
  contactChannelId: string | null;
  createdAt: Date;
  updatedAt: Date;
  contactChannel?: { id: string; value: string; label: string | null } | null;
  participants: Array<{
    contactId: string;
    contact: { id: string; firstName: string; lastName: string };
  }>;
  workOpportunity?: {
    id: string;
    title: string;
    company?: { id: string; name: string } | null;
  } | null;
  company?: { id: string; name: string } | null;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    company?: { id: string; name: string } | null;
  } | null;
}) {
  return {
    id: action.id,
    occurredAt: action.occurredAt.toISOString(),
    type: action.type,
    notes: action.notes,
    metadata: action.metadata as Record<string, unknown> | null,
    channelTypeCode: action.channelTypeCode,
    userId: action.userId,
    workOpportunityId: action.workOpportunityId ?? null,
    companyId: action.companyId ?? null,
    contactId: action.contactId ?? null,
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
    workOpportunity: action.workOpportunity
      ? {
          id: action.workOpportunity.id,
          title: action.workOpportunity.title,
          company: action.workOpportunity.company ?? undefined,
        }
      : undefined,
    company: action.company ?? undefined,
    contact: action.contact
      ? {
          id: action.contact.id,
          firstName: action.contact.firstName,
          lastName: action.contact.lastName,
          company: action.contact.company ?? undefined,
        }
      : undefined,
  };
}

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const workOpportunityId = searchParams.get("workOpportunityId") ?? undefined;
    const companyId = searchParams.get("companyId") ?? undefined;
    const contactId = searchParams.get("contactId") ?? undefined;
    const type = (searchParams.get("type") as OpportunityActionType | null) ?? undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : undefined;

    const actions = await getAllActions(
      userId,
      { workOpportunityId, companyId, contactId, type },
      { limit, offset }
    );

    const items = actions.map(actionToDto);
    return jsonOk({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();

    const validatedData = opportunityActionCreateSchema.parse(body);

    if (validatedData.companyId) {
      const company = await prisma.company.findFirst({
        where: { id: validatedData.companyId, userId },
      });
      if (!company) {
        return handleRouteError(new Error("Company not found"));
      }
    }

    if (validatedData.contactId) {
      const contact = await prisma.contact.findFirst({
        where: { id: validatedData.contactId, company: { userId } },
      });
      if (!contact) {
        return handleRouteError(new Error("Contact not found"));
      }
    }

    if (validatedData.contactChannelId) {
      const channel = await prisma.contactChannel.findFirst({
        where: {
          id: validatedData.contactChannelId,
          contact: { company: { userId } },
        },
      });
      if (!channel) {
        return handleRouteError(new Error("Contact channel not found"));
      }
    }

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

    const action = await createOpportunityAction(userId, {
      ...validatedData,
      workOpportunityId: validatedData.workOpportunityId ?? undefined,
      companyId: validatedData.companyId ?? undefined,
      contactId: validatedData.contactId ?? undefined,
    });

    const dto = actionToDto(action);
    return jsonCreated(dto);
  } catch (error) {
    return handleRouteError(error);
  }
}
