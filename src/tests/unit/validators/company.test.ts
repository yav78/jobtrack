import { describe, expect, it } from "vitest";
import { companyCreateSchema, locationCreateSchema } from "@/lib/validators/company";

describe("company validators", () => {
  it("valid company create", () => {
    const parsed = companyCreateSchema.parse({
      name: "Acme",
      typeCode: "CLIENT_FINAL",
      website: "https://acme.example.com",
    });
    expect(parsed.name).toBe("Acme");
  });

  it("rejects empty name", () => {
    expect(() => companyCreateSchema.parse({ name: "", typeCode: "CLIENT_FINAL" })).toThrow();
  });
});

describe("location validators", () => {
  it("valid location create", () => {
    const parsed = locationCreateSchema.parse({
      label: "HQ",
      addressLine1: "1 rue",
      zipCode: "75000",
      city: "Paris",
      country: "France",
      isPrimary: true,
    });
    expect(parsed.isPrimary).toBe(true);
  });

  it("rejects missing required fields", () => {
    expect(() => locationCreateSchema.parse({ label: "" })).toThrow();
  });
});

