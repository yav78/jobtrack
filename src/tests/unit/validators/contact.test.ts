import { describe, expect, it } from "vitest";
import { contactCreateSchema, contactUpdateSchema, contactChannelCreateSchema } from "@/lib/validators/contact";

describe("contactCreateSchema", () => {
  it("accepts contact with companyId", () => {
    const result = contactCreateSchema.parse({
      companyId: "00000000-0000-0000-0000-000000000001",
      firstName: "Alice",
      lastName: "Martin",
    });
    expect(result.firstName).toBe("Alice");
    expect(result.companyId).toBe("00000000-0000-0000-0000-000000000001");
  });

  it("accepts contact without companyId", () => {
    const result = contactCreateSchema.parse({
      firstName: "Alice",
      lastName: "Martin",
    });
    expect(result.firstName).toBe("Alice");
    expect(result.companyId).toBeUndefined();
  });

  it("defaults channels to empty array", () => {
    const result = contactCreateSchema.parse({ firstName: "Alice", lastName: "Martin" });
    expect(result.channels).toEqual([]);
  });

  it("accepts channels", () => {
    const result = contactCreateSchema.parse({
      firstName: "Alice",
      lastName: "Martin",
      channels: [
        { channelTypeCode: "EMAIL", value: "alice@example.com" },
        { channelTypeCode: "LINKEDIN", value: "https://linkedin.com/in/alice" },
      ],
    });
    expect(result.channels).toHaveLength(2);
    expect(result.channels[0].channelTypeCode).toBe("EMAIL");
  });

  it("rejects missing firstName", () => {
    expect(() =>
      contactCreateSchema.parse({ lastName: "Martin" })
    ).toThrow();
  });
});

describe("contactUpdateSchema", () => {
  it("accepts partial update", () => {
    const result = contactUpdateSchema.parse({ firstName: "Bob" });
    expect(result.firstName).toBe("Bob");
  });

  it("accepts companyId: null to delink", () => {
    const result = contactUpdateSchema.parse({ companyId: null });
    expect(result.companyId).toBeNull();
  });

  it("accepts valid companyId uuid", () => {
    const result = contactUpdateSchema.parse({
      companyId: "00000000-0000-0000-0000-000000000002",
    });
    expect(result.companyId).toBe("00000000-0000-0000-0000-000000000002");
  });

  it("does not accept channels (channels are managed separately)", () => {
    // channels key should be stripped/ignored by the schema
    const result = contactUpdateSchema.parse({
      firstName: "Alice",
      channels: [{ channelTypeCode: "EMAIL", value: "x@y.com" }],
    });
    expect((result as Record<string, unknown>).channels).toBeUndefined();
  });
});

describe("contactChannelCreateSchema", () => {
  it("valid channel", () => {
    const result = contactChannelCreateSchema.parse({
      channelTypeCode: "EMAIL",
      value: "a@example.com",
      isPrimary: true,
    });
    expect(result.isPrimary).toBe(true);
  });
});
