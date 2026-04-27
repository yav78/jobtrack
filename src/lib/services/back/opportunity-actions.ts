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

export async function getRecentOpportunityActions(
  userId: string,
  limit = 20
): Promise<OpportunityActionWithOpportunity[]> {
  const actions = await prisma.opportunityAction.findMany({
    where: { userId },
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
      documents: {
        include: {
          document: {
            select: {
              id: true,
              title: true,
              originalName: true,
              mimeType: true,
              size: true,
            },
          },
        },
      },
      workOpportunity: {
        select: {
          id: true,
          title: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      contact: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
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
      documents: {
        include: {
          document: {
            select: {
              id: true,
              title: true,
              originalName: true,
              mimeType: true,
              size: true,
            },
          },
        },
      },
      workOpportunity: {
        select: {
          id: true,
          title: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      contact: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
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
      documents: {
        include: {
          document: {
            select: {
              id: true,
              title: true,
              originalName: true,
              mimeType: true,
              size: true,
            },
          },
        },
      },
      workOpportunity: {
        select: {
          id: true,
          title: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      contact: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
  return found as OpportunityActionWithOpportunity | null;
}

export async function createOpportunityAction(
  userId: string,
  data: OpportunityActionCreateInput & { workOpportunityId?: string; companyId?: string; contactId?: string }
): Promise<OpportunityActionWithOpportunity> {
  const { participantContactIds, workOpportunityId, companyId, contactId, ...actionData } = data;

  const { metadata, ...restActionData } = actionData;
  const action = await prisma.opportunityAction.create({
    data: {
      ...restActionData,
      ...(metadata !== undefined ? { metadata: metadata as Prisma.InputJsonValue } : {}),
      userId,
      workOpportunityId: workOpportunityId ?? undefined,
      companyId: companyId ?? undefined,
      contactId: contactId ?? undefined,
      participants:
        participantContactIds && participantContactIds.length > 0
          ? { create: participantContactIds.map((id) => ({ contactId: id })) }
          : undefined,
    } as Prisma.OpportunityActionUncheckedCreateInput,
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
      documents: {
        include: {
          document: {
            select: {
              id: true,
              title: true,
              originalName: true,
              mimeType: true,
              size: true,
            },
          },
        },
      },
      workOpportunity: {
        select: {
          id: true,
          title: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      contact: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

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

  const { metadata, workOpportunityId, companyId, contactId, ...restActionData } = actionData;
  const updateData: Prisma.OpportunityActionUncheckedUpdateInput = {
    ...restActionData,
    ...(metadata !== undefined ? { metadata: metadata as Prisma.InputJsonValue } : {}),
    ...(workOpportunityId !== undefined ? { workOpportunityId } : {}),
    ...(companyId !== undefined ? { companyId } : {}),
    ...(contactId !== undefined ? { contactId } : {}),
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
