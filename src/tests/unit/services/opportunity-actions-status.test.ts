import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  opportunityActionCreate: vi.fn(),
  opportunityActionFindFirst: vi.fn(),
  opportunityActionUpdate: vi.fn(),
  opportunityActionContactDeleteMany: vi.fn(),
  opportunityActionContactCreateMany: vi.fn(),
  workOpportunityUpdateMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    opportunityAction: {
      create: mocks.opportunityActionCreate,
      findFirst: mocks.opportunityActionFindFirst,
      update: mocks.opportunityActionUpdate,
    },
    opportunityActionContact: {
      deleteMany: mocks.opportunityActionContactDeleteMany,
      createMany: mocks.opportunityActionContactCreateMany,
    },
    workOpportunity: {
      updateMany: mocks.workOpportunityUpdateMany,
    },
  },
}));

import {
  createOpportunityAction,
  updateOpportunityAction,
} from "@/lib/services/back/opportunity-actions";

const userId = "00000000-0000-0000-0000-000000000001";
const actionId = "00000000-0000-0000-0000-000000000101";
const opportunityId = "00000000-0000-0000-0000-000000000201";

describe("opportunity action status sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.opportunityActionCreate.mockResolvedValue({ id: actionId });
    mocks.opportunityActionFindFirst.mockResolvedValue({
      id: actionId,
      userId,
      type: "OUTBOUND_CONTACT",
      workOpportunityId: opportunityId,
    });
    mocks.opportunityActionUpdate.mockResolvedValue({ id: actionId });
    mocks.workOpportunityUpdateMany.mockResolvedValue({ count: 1 });
  });

  it("marks the linked opportunity as applied when creating an applied action", async () => {
    await createOpportunityAction(userId, {
      type: "APPLIED",
      occurredAt: new Date("2026-04-27T10:00:00.000Z"),
      workOpportunityId: opportunityId,
    });

    expect(mocks.workOpportunityUpdateMany).toHaveBeenCalledWith({
      where: { id: opportunityId, userId, deletedAt: null },
      data: { status: "APPLIED" },
    });
  });

  it("marks the existing linked opportunity as applied when changing an action to applied", async () => {
    await updateOpportunityAction(actionId, userId, {
      type: "APPLIED",
    });

    expect(mocks.workOpportunityUpdateMany).toHaveBeenCalledWith({
      where: { id: opportunityId, userId, deletedAt: null },
      data: { status: "APPLIED" },
    });
  });

  it("does not update an opportunity status for an applied action without opportunity", async () => {
    mocks.opportunityActionFindFirst.mockResolvedValue({
      id: actionId,
      userId,
      type: "OUTBOUND_CONTACT",
      workOpportunityId: null,
    });

    await updateOpportunityAction(actionId, userId, {
      type: "APPLIED",
    });

    expect(mocks.workOpportunityUpdateMany).not.toHaveBeenCalled();
  });
});
