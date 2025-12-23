import { prisma } from "@/lib/prisma";
import type { OpportunityActionType, Prisma } from "@prisma/client";
import type { OpportunityActionCreateInput, OpportunityActionUpdateInput } from "./types";

type OpportunityActionWithRelations = Prisma.OpportunityActionGetPayload<{
  include: {
    contactChannel: {
      select: {
        id: true;
        value: true;
        label: true;
      };
    };
    participants: {
      include: {
        contact: {
          select: {
            id: true;
            firstName: true;
            lastName: true;
          };
        };
      };
    };
  };
}>;

export async function getOpportunityActions(
  opportunityId: string,
  userId: string,
  options?: { type?: OpportunityActionType }
): Promise<OpportunityActionWithRelations[]> {
  const where: {
    workOpportunityId: string;
    userId: string;
    type?: OpportunityActionType;
  } = {
    workOpportunityId: opportunityId,
    userId,
  };

  if (options?.type) {
    where.type = options.type;
  }

  const actions = await prisma.opportunityAction.findMany({
    where,
    include: {
      contactChannel: {
        select: {
          id: true,
          value: true,
          label: true,
        },
      },
      participants: {
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
    orderBy: {
      occurredAt: "desc",
    },
  });

  return actions;
}

export async function createOpportunityAction(
  userId: string,
  data: OpportunityActionCreateInput & { workOpportunityId: string }
): Promise<OpportunityActionWithRelations> {
  const { participantContactIds, ...actionData } = data;

  const { metadata, ...restActionData } = actionData;
  const action = await prisma.opportunityAction.create({
    data: {
      ...restActionData,
      ...(metadata !== undefined ? { metadata: metadata as Prisma.InputJsonValue } : {}),
      userId,
      participants: participantContactIds && participantContactIds.length > 0
        ? {
            create: participantContactIds.map((contactId) => ({ contactId })),
          }
        : undefined,
    },
    include: {
      contactChannel: {
        select: {
          id: true,
          value: true,
          label: true,
        },
      },
      participants: {
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  return action;
}

export async function updateOpportunityAction(
  actionId: string,
  userId: string,
  data: OpportunityActionUpdateInput
): Promise<OpportunityActionWithRelations> {
  const { participantContactIds, ...actionData } = data;

  // Vérifier que l'action appartient à l'utilisateur
  const existing = await prisma.opportunityAction.findFirst({
    where: { id: actionId, userId },
  });

  if (!existing) {
    throw new Error("Action not found");
  }

  // Mettre à jour les participants si fournis
  if (participantContactIds !== undefined) {
    // Supprimer les participants existants
    await prisma.opportunityActionContact.deleteMany({
      where: { actionId },
    });

    // Créer les nouveaux participants
    if (participantContactIds.length > 0) {
      await prisma.opportunityActionContact.createMany({
        data: participantContactIds.map((contactId) => ({
          actionId,
          contactId,
        })),
      });
    }
  }

  const { metadata, ...restActionData } = actionData;
  const updated = await prisma.opportunityAction.update({
    where: { id: actionId },
    data: {
      ...restActionData,
      ...(metadata !== undefined ? { metadata: metadata as Prisma.InputJsonValue } : {}),
    },
    include: {
      contactChannel: {
        select: {
          id: true,
          value: true,
          label: true,
        },
      },
      participants: {
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  return updated;
}

export async function deleteOpportunityAction(actionId: string, userId: string) {
  const existing = await prisma.opportunityAction.findFirst({
    where: { id: actionId, userId },
  });

  if (!existing) {
    throw new Error("Action not found");
  }

  await prisma.opportunityAction.delete({
    where: { id: actionId },
  });
}

