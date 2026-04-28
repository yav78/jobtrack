import { handleRouteError, requireUserId } from "@/lib/api-helpers";
import { jsonOk } from "@/lib/errors/response";
import { prisma } from "@/lib/prisma";
import {
  getApplicationsByJobboard,
  getRecentOpportunityActions,
} from "@/lib/services/back/opportunity-actions";
import type { OpportunityActionType } from "@prisma/client";

export async function GET() {
  try {
    const userId = await requireUserId();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const now = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const [
      [companies, contacts, opportunities, entretiens, actionsTotal, actionsLast30Days],
      actionsByType,
      recentActions,
      opportunitiesByStatus,
      upcomingFollowUps,
      applicationsByJobboard,
    ] = await Promise.all([
      prisma.$transaction([
        prisma.company.count({ where: { userId, deletedAt: null } }),
        prisma.contact.count({ where: { deletedAt: null, company: { userId, deletedAt: null } } }),
        prisma.workOpportunity.count({ where: { userId, deletedAt: null } }),
        prisma.entretien.count({ where: { userId } }),
        prisma.opportunityAction.count({ where: { userId } }),
        prisma.opportunityAction.count({
          where: {
            userId,
            occurredAt: { gte: thirtyDaysAgo },
          },
        }),
      ]),
      prisma.opportunityAction.groupBy({
        by: ["type"],
        _count: { _all: true },
        where: { userId },
      }),
      getRecentOpportunityActions(userId, 20),
      prisma.workOpportunity.groupBy({
        by: ["status"],
        _count: { _all: true },
        where: { userId, deletedAt: null },
      }),
      prisma.workOpportunity.findMany({
        where: { userId, deletedAt: null, followUpAt: { lte: sevenDaysLater, not: null } },
        orderBy: { followUpAt: "asc" },
        take: 10,
        select: { id: true, title: true, followUpAt: true, status: true },
      }),
      getApplicationsByJobboard(userId),
    ]);

    const stats = {
      companies,
      contacts,
      opportunities,
      entretiens,
      actionsTotal,
      actionsLast30Days,
      actionsByType: actionsByType.map((item: { type: OpportunityActionType; _count: { _all: number } }) => ({
        type: item.type,
        count: item._count._all,
      })),
      opportunitiesByStatus: opportunitiesByStatus.map((item) => ({
        status: item.status,
        count: item._count._all,
      })),
      upcomingFollowUps: upcomingFollowUps.map((o) => ({
        id: o.id,
        title: o.title,
        status: o.status,
        followUpAt: o.followUpAt!.toISOString(),
        isOverdue: o.followUpAt! < now,
      })),
      applicationsByJobboard,
    };

    const recent = recentActions.map((action) => ({
      id: action.id,
      occurredAt: action.occurredAt.toISOString(),
      type: action.type,
      notes: action.notes,
      metadata: action.metadata as Record<string, unknown> | null,
      userId: action.userId,
      workOpportunityId: action.workOpportunityId,
      linkId: action.linkId,
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
            company: action.workOpportunity.company
              ? {
                  id: action.workOpportunity.company.id,
                  name: action.workOpportunity.company.name,
                }
              : undefined,
          }
        : undefined,
      company: action.company
        ? { id: action.company.id, name: action.company.name }
        : undefined,
      link: action.link ? { id: action.link.id, title: action.link.title } : undefined,
    }));

    return jsonOk({ stats, recentActions: recent });
  } catch (error) {
    return handleRouteError(error);
  }
}
