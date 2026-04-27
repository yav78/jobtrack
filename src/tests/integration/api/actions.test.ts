import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { POST as postAction, GET as getActions } from "@/app/api/actions/route";
import { PATCH as patchAction } from "@/app/api/actions/[actionId]/route";
import { NextRequest } from "next/server";

const userId = "00000000-0000-0000-0000-000000000001";

function makeRequest(url: string, method: string, body?: unknown) {
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json", "x-user-id": userId },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("API actions standalone", () => {
  let opportunityId: string;

  beforeAll(async () => {
    await prisma.opportunityActionContact.deleteMany();
    await prisma.opportunityAction.deleteMany();
    await prisma.workOpportunity.deleteMany();
    await prisma.contactChannel.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.company.deleteMany();
    await prisma.companyType.createMany({
      data: [{ code: "CLIENT_FINAL", label: "Client" }],
      skipDuplicates: true,
    });
    await prisma.user.upsert({
      where: { id: userId },
      update: { fullName: "Demo", email: "demo@example.com" },
      create: { id: userId, fullName: "Demo", email: "demo@example.com", password: "x" },
    });

    const opp = await prisma.workOpportunity.create({
      data: { title: "Op Test", userId },
    });
    opportunityId = opp.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates action without opportunity and does not assign one", async () => {
    const res = await postAction(
      makeRequest("http://localhost/api/actions", "POST", {
        type: "NOTE",
        occurredAt: new Date().toISOString(),
      })
    );
    expect(res.status).toBe(201);
    const action = await res.json();
    expect(action.workOpportunityId).toBeNull();
  });

  it("creates action with opportunity then removes it via PATCH", async () => {
    // Create with opportunity
    const createRes = await postAction(
      makeRequest("http://localhost/api/actions", "POST", {
        type: "NOTE",
        occurredAt: new Date().toISOString(),
        workOpportunityId: opportunityId,
      })
    );
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.workOpportunityId).toBe(opportunityId);

    // Remove opportunity via PATCH
    const patchRes = await patchAction(
      makeRequest(`http://localhost/api/actions/${created.id}`, "PATCH", {
        workOpportunityId: null,
      }),
      { params: Promise.resolve({ actionId: created.id }) }
    );
    expect(patchRes.status).toBe(200);
    const updated = await patchRes.json();
    expect(updated.workOpportunityId).toBeNull();

    // Verify in DB
    const inDb = await prisma.opportunityAction.findUnique({ where: { id: created.id } });
    expect(inDb?.workOpportunityId).toBeNull();
  });

  it("PATCH without workOpportunityId field preserves existing opportunity", async () => {
    // Create with opportunity
    const createRes = await postAction(
      makeRequest("http://localhost/api/actions", "POST", {
        type: "NOTE",
        occurredAt: new Date().toISOString(),
        workOpportunityId: opportunityId,
      })
    );
    const created = await createRes.json();

    // PATCH without mentioning workOpportunityId (field absent)
    const patchRes = await patchAction(
      makeRequest(`http://localhost/api/actions/${created.id}`, "PATCH", {
        notes: "updated note",
      }),
      { params: Promise.resolve({ actionId: created.id }) }
    );
    expect(patchRes.status).toBe(200);
    const updated = await patchRes.json();
    expect(updated.workOpportunityId).toBe(opportunityId);
  });

  it("lists actions without filtering does not add unexpected opportunity", async () => {
    const res = await postAction(
      makeRequest("http://localhost/api/actions", "POST", {
        type: "CALL",
        occurredAt: new Date().toISOString(),
      })
    );
    const action = await res.json();

    const listRes = await getActions(makeRequest("http://localhost/api/actions", "GET"));
    const list = await listRes.json();
    const found = list.items.find((a: { id: string }) => a.id === action.id);
    expect(found).toBeDefined();
    expect(found.workOpportunityId).toBeNull();
  });
});
