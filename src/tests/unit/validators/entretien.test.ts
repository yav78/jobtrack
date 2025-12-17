import { describe, expect, it } from "vitest";
import { entretienCreateSchema } from "@/lib/validators/entretien";

describe("entretien validators", () => {
  it("valid create", () => {
    const parsed = entretienCreateSchema.parse({
      date: new Date().toISOString(),
      workOpportunityId: "00000000-0000-0000-0000-000000000001",
      contactChannelId: "00000000-0000-0000-0000-000000000002",
      contactIds: ["00000000-0000-0000-0000-000000000003"],
    });
    expect(parsed.contactIds.length).toBe(1);
  });

  it("rejects without contacts", () => {
    expect(() =>
      entretienCreateSchema.parse({
        date: new Date().toISOString(),
        workOpportunityId: "00000000-0000-0000-0000-000000000001",
        contactChannelId: "00000000-0000-0000-0000-000000000002",
        contactIds: [],
      })
    ).toThrow();
  });
});

