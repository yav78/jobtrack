import { jsonError, jsonOk } from "@/lib/errors/response";
import { getCompanyTypes } from "@/lib/services/company-types";
import type { CompanyTypeDTO } from "@/lib/dto/company-type";

export async function GET() {
  try {
    const companyTypes = await getCompanyTypes();

    const items: CompanyTypeDTO[] = companyTypes.map((ct) => ({
      code: ct.code,
      label: ct.label,
    }));

    return jsonOk({ items });
  } catch (error) {
    console.error("Error fetching company types:", error);
    return jsonError(error);
  }
}
