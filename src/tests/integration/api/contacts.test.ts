import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { POST as postContact, GET as getContacts } from "@/app/api/contacts/route";
import { PATCH as patchContact } from "@/app/api/contacts/[id]/route";
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
      create: { id: userId, fullName: "Demo", email: "demo@example.com", password: "x" },
    });
    const company = await prisma.company.create({
      data: { name: "ContactCo", typeCode: "CLIENT_FINAL", userId },
    });
    companyId = company.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates contact with company then lists", async () => {
    const res = await postContact(
      makeRequest("http://localhost/api/contacts", "POST", {
        companyId,
        firstName: "Alice",
        lastName: "Martin",
      })
    );
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.firstName).toBe("Alice");
    expect(data.companyId).toBe(companyId);

    const listRes = await getContacts(makeRequest("http://localhost/api/contacts", "GET"));
    const list = await listRes.json();
    expect(list.items.length).toBeGreaterThan(0);
  });

  it("creates contact without company", async () => {
    const res = await postContact(
      makeRequest("http://localhost/api/contacts", "POST", {
        firstName: "Bob",
        lastName: "Dupont",
      })
    );
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.firstName).toBe("Bob");
    expect(data.companyId).toBeNull();
  });

  it("creates contact with inline channels", async () => {
    const res = await postContact(
      makeRequest("http://localhost/api/contacts", "POST", {
        firstName: "Clara",
        lastName: "Durand",
        channels: [
          { channelTypeCode: "EMAIL", value: "clara@example.com" },
          { channelTypeCode: "LINKEDIN", value: "https://linkedin.com/in/clara" },
        ],
      })
    );
    const data = await res.json();
    expect(res.status).toBe(201);
    const channels = await prisma.contactChannel.findMany({ where: { contactId: data.id } });
    expect(channels).toHaveLength(2);
    expect(channels.some((c) => c.channelTypeCode === "EMAIL")).toBe(true);
    expect(channels.some((c) => c.channelTypeCode === "LINKEDIN")).toBe(true);
  });

  it("GET ?unlinked=true returns only contacts without company", async () => {
    const res = await getContacts(
      makeRequest("http://localhost/api/contacts?unlinked=true", "GET")
    );
    const list = await res.json();
    expect(list.items.every((c: { companyId: string | null }) => c.companyId === null)).toBe(true);
    expect(list.items.length).toBeGreaterThanOrEqual(2); // Bob + Clara
  });

  it("PATCH links a contact to a company", async () => {
    const unlinked = await prisma.contact.findFirst({ where: { userId, companyId: null } });
    expect(unlinked).toBeTruthy();

    const res = await patchContact(
      makeRequest(`http://localhost/api/contacts/${unlinked!.id}`, "PATCH", { companyId }),
      { params: Promise.resolve({ id: unlinked!.id }) }
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.companyId).toBe(companyId);
  });

  it("PATCH with companyId: null delinks a contact", async () => {
    const linked = await prisma.contact.findFirst({ where: { userId, companyId } });
    expect(linked).toBeTruthy();

    const res = await patchContact(
      makeRequest(`http://localhost/api/contacts/${linked!.id}`, "PATCH", { companyId: null }),
      { params: Promise.resolve({ id: linked!.id }) }
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.companyId).toBeNull();
  });

  it("sets primary per channel type", async () => {
    const contact = await prisma.contact.findFirst({ where: { userId } });
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

    await postChannel(
      makeRequest(`http://localhost/api/contacts/${cid}/channels`, "POST", {
        channelTypeCode: "EMAIL",
        value: "b@example.com",
        isPrimary: true,
      }),
      { params: { id: cid } as { id: string } }
    );

    const channels = await prisma.contactChannel.findMany({
      where: { contactId: cid, channelTypeCode: "EMAIL" },
    });
    expect(channels.filter((c) => c.isPrimary).length).toBe(1);

    await patchChannel(
      makeRequest(`http://localhost/api/channels/${ch1.id}`, "PATCH", { isPrimary: true }),
      { params: { id: ch1.id } as { id: string } }
    );
    const after = await prisma.contactChannel.findMany({
      where: { contactId: cid, channelTypeCode: "EMAIL" },
    });
    expect(after.filter((c) => c.isPrimary).length).toBe(1);
  });
});
