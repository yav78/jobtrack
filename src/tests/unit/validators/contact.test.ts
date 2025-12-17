import { describe, expect, it } from "vitest";
import { contactCreateSchema, contactChannelCreateSchema } from "@/lib/validators/contact";

describe("contact validators", () => {
  it("valid contact create", () => {
    const parsed = contactCreateSchema.parse({
      companyId: "00000000-0000-0000-0000-000000000001",
      firstName: "Alice",
      lastName: "Martin",
    });
    expect(parsed.firstName).toBe("Alice");
  });

  it("rejects missing first name", () => {
    expect(() =>
      contactCreateSchema.parse({
        companyId: "00000000-0000-0000-0000-000000000001",
        lastName: "Martin",
      })
    ).toThrow();
  });
});

describe("contact channel validators", () => {
  it("valid channel", () => {
    const parsed = contactChannelCreateSchema.parse({
      channelTypeCode: "EMAIL",
      value: "a@example.com",
      isPrimary: true,
    });
    expect(parsed.isPrimary).toBe(true);
  });
});

