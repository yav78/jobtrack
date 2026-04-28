import { prisma } from "@/lib/prisma";
import { NotFound } from "@/lib/errors";
import type { OpportunityActionType, Prisma } from "@prisma/client";
import type { OpportunityActionCreateInput, OpportunityActionUpdateInput } from "../types";

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

type OpportunityActionWithOpportunity = Prisma.OpportunityActionGetPayload<{
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
    documents: {
      include: {
        document: {
          select: {
            id: true;
            title: true;
            originalName: true;
            mimeType: true;
            size: true;
          };
        };
      };
    };
    workOpportunity: {
      select: {
        id: true;
        title: true;
        company: {
          select: {
            id: true;
            name: true;
          };
        };
      };
    };
    company: {
      select: {
        id: true;
        name: true;
      };
    };
    contact: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
        company: {
          select: {
            id: true;
            name: true;
          };
        };
      };
    };
    link: { select: { id: true; title: true } };
  };
}>;

const ACTION_FULL_INCLUDE = {
  contactChannel: { select: { id: true, value: true, label: true } },
  participants: {
    include: {
      contact: { select: { id: true, firstName: true, lastName: true } },
    },
  },
  documents: {
    include: {
      document: {
        select: { id: true, title: true, originalName: true, mimeType: true, size: true },
      },
    },
  },
  workOpportunity: {
    select: {
      id: true,
      title: true,
      company: { select: { id: true, name: true } },
    },
  },
  company: { select: { id: true, name: true } },
  contact: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      company: { select: { id: true, name: true } },
    },
  },
  link: { select: { id: true, title: true } },
} as const;

async function markOpportunityApplied(
  userId: string,
  type: OpportunityActionType,
  workOpportunityId?: string | null
): Promise<void> {
  if (type !== "APPLIED" || !workOpportunityId) return;

  await prisma.workOpportunity.updateMany({
    where: { id: workOpportunityId, userId, deletedAt: null },
    data: { status: "APPLIED" },
  });
}

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

export async function getRecentOpportunityActions(
  userId: string,
  limit = 20
): Promise<OpportunityActionWithOpportunity[]> {
  const actions = await prisma.opportunityAction.findMany({
    where: { userId },
    include: ACTION_FULL_INCLUDE,
    orderBy: {
      occurredAt: "desc",
    },
    take: limit,
  });

  return actions as OpportunityActionWithOpportunity[];
}

export type ListActionsFilters = {
  workOpportunityId?: string;
  companyId?: string;
  contactId?: string;
  type?: OpportunityActionType;
};

export async function getAllActions(
  userId: string,
  filters?: ListActionsFilters,
  options?: { limit?: number; offset?: number }
): Promise<OpportunityActionWithOpportunity[]> {
  const where: Prisma.OpportunityActionWhereInput = { userId };

  if (filters?.workOpportunityId !== undefined) {
    where.workOpportunityId = filters.workOpportunityId;
  }
  if (filters?.companyId !== undefined) {
    (where as Record<string, unknown>).companyId = filters.companyId;
  }
  if (filters?.contactId !== undefined) {
    (where as Record<string, unknown>).contactId = filters.contactId;
  }
  if (filters?.type !== undefined) {
    where.type = filters.type;
  }

  const actions = await prisma.opportunityAction.findMany({
    where,
    include: ACTION_FULL_INCLUDE,
    orderBy: {
      occurredAt: "desc",
    },
    take: options?.limit ?? 50,
    skip: options?.offset ?? 0,
  });

  return actions as OpportunityActionWithOpportunity[];
}

export async function getOpportunityActionById(
  actionId: string,
  userId: string
): Promise<OpportunityActionWithOpportunity | null> {
  const found = await prisma.opportunityAction.findFirst({
    where: { id: actionId, userId },
    include: ACTION_FULL_INCLUDE,
  });
  return found as OpportunityActionWithOpportunity | null;
}

export async function createOpportunityAction(
  userId: string,
  data: OpportunityActionCreateInput & {
    workOpportunityId?: string | null;
    companyId?: string | null;
    contactId?: string | null;
  }
): Promise<OpportunityActionWithOpportunity> {
  const { participantContactIds, workOpportunityId, companyId, contactId, linkId, ...actionData } =
    data;

  const { metadata, ...restActionData } = actionData;
  const action = await prisma.opportunityAction.create({
    data: {
      ...restActionData,
      ...(metadata !== undefined ? { metadata: metadata as Prisma.InputJsonValue } : {}),
      userId,
      workOpportunityId: workOpportunityId ?? undefined,
      companyId: companyId ?? undefined,
      contactId: contactId ?? undefined,
      linkId: linkId ?? undefined,
      participants:
        participantContactIds && participantContactIds.length > 0
          ? { create: participantContactIds.map((id) => ({ contactId: id })) }
          : undefined,
    } as Prisma.OpportunityActionUncheckedCreateInput,
    include: ACTION_FULL_INCLUDE,
  });

  await markOpportunityApplied(userId, data.type, workOpportunityId);

  return action as OpportunityActionWithOpportunity;
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
    throw NotFound("Action not found");
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

  const { metadata, workOpportunityId, companyId, contactId, linkId, ...restActionData } =
    actionData;
  const updateData: Prisma.OpportunityActionUncheckedUpdateInput = {
    ...restActionData,
    ...(metadata !== undefined ? { metadata: metadata as Prisma.InputJsonValue } : {}),
    ...(workOpportunityId !== undefined ? { workOpportunityId } : {}),
    ...(companyId !== undefined ? { companyId } : {}),
    ...(contactId !== undefined ? { contactId } : {}),
    ...(linkId !== undefined ? { linkId } : {}),
  };
  const updated = await prisma.opportunityAction.update({
    where: { id: actionId },
    data: updateData as Prisma.OpportunityActionUpdateInput,
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

  const finalType = actionData.type ?? existing.type;
  const finalWorkOpportunityId =
    workOpportunityId !== undefined ? workOpportunityId : existing.workOpportunityId;
  await markOpportunityApplied(userId, finalType, finalWorkOpportunityId);

  return updated;
}

export async function deleteOpportunityAction(actionId: string, userId: string) {
  const existing = await prisma.opportunityAction.findFirst({
    where: { id: actionId, userId },
  });

  if (!existing) {
    throw NotFound("Action not found");
  }

  await prisma.opportunityAction.delete({
    where: { id: actionId },
  });
}

export type JobboardStat = {
  linkId: string | null;
  linkTitle: string | null;
  count: number;
};

export async function getApplicationsByJobboard(userId: string): Promise<JobboardStat[]> {
  const groups = await prisma.opportunityAction.groupBy({
    by: ["linkId"],
    _count: { _all: true },
    where: { userId, type: "APPLIED" },
  });

  const linkIds = groups.map((g) => g.linkId).filter((id): id is string => id !== null);

  const links =
    linkIds.length > 0
      ? await prisma.link.findMany({
          where: { id: { in: linkIds } },
          select: { id: true, title: true },
        })
      : [];

  const linkMap = new Map(links.map((l) => [l.id, l.title]));

  return groups.map((g) => ({
    linkId: g.linkId,
    linkTitle: g.linkId ? (linkMap.get(g.linkId) ?? null) : null,
    count: g._count._all,
  }));
}
