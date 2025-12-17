import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { POST as postContact, GET as getContacts } from "@/app/api/contacts/route";
import { POST as postChannel } from "@/app/api/contacts/[id]/channels/route";
import { PATCH as patchChannel } from "@/app/api/channels/[id]/route";
import { NextRequest } from "next/server";

const userId = "00000000-0000-0000-0000-000000000001";

function makeRequest(url: string, method: string, body?: unknown) {
  return new NextRequest(url, {
    method,
    headers: {
      "content-type": "application/json",
      "x-user-id": userId,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("API contacts/channels", () => {
  let companyId: string;

  beforeAll(async () => {
    await prisma.entretienContact.deleteMany();
    await prisma.entretien.deleteMany();
    await prisma.workOpportunity.deleteMany();
    await prisma.contactChannel.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.location.deleteMany();
    await prisma.company.deleteMany();
    await prisma.companyType.createMany({
      data: [
        { code: "CLIENT_FINAL", label: "Client final" },
        { code: "ESN", label: "ESN" },
      ],
      skipDuplicates: true,
    });
    await prisma.user.upsert({
      where: { id: userId },
      update: { fullName: "Demo", email: "demo@example.com" },
      create: { id: userId, fullName: "Demo", email: "demo@example.com" },
    });
    const company = await prisma.company.create({
      data: {
        name: "ContactCo",
        typeCode: "CLIENT_FINAL",
        userId,
      },
    });
    companyId = company.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates contact then lists", async () => {
    const resCreate = await postContact(
      makeRequest("http://localhost/api/contacts", "POST", {
        companyId,
        firstName: "Alice",
        lastName: "Martin",
      })
    );
    const data = await resCreate.json();
    expect(resCreate.status).toBe(201);
    expect(data.firstName).toBe("Alice");

    const resList = await getContacts(makeRequest("http://localhost/api/contacts", "GET"));
    const list = await resList.json();
    expect(list.items.length).toBeGreaterThan(0);
  });

  it("sets primary per channel type", async () => {
    const contact = await prisma.contact.findFirst({ where: { companyId } });
    expect(contact).toBeTruthy();
    const cid = contact!.id;

    const resCh1 = await postChannel(
      makeRequest(`http://localhost/api/contacts/${cid}/channels`, "POST", {
        channelTypeCode: "EMAIL",
        value: "a@example.com",
        isPrimary: true,
      }),
      { params: { id: cid } as { id: string } }
    );
    expect(resCh1.status).toBe(201);
    const ch1 = await resCh1.json();

    const resCh2 = await postChannel(
      makeRequest(`http://localhost/api/contacts/${cid}/channels`, "POST", {
        channelTypeCode: "EMAIL",
        value: "b@example.com",
        isPrimary: true,
      }),
      { params: { id: cid } as { id: string } }
    );
    expect(resCh2.status).toBe(201);

    const channels = await prisma.contactChannel.findMany({ where: { contactId: cid, channelTypeCode: "EMAIL" } });
    const primaryCount = channels.filter((c) => c.isPrimary).length;
    expect(primaryCount).toBe(1);

    // Demote primary via patch
    await patchChannel(
      makeRequest(`http://localhost/api/channels/${ch1.id}`, "PATCH", { isPrimary: true }),
      { params: { id: ch1.id } as { id: string } }
    );
    const channelsAfter = await prisma.contactChannel.findMany({
      where: { contactId: cid, channelTypeCode: "EMAIL" },
    });
    expect(channelsAfter.filter((c) => c.isPrimary).length).toBe(1);
  });
});

