import { useEffect, useState } from "react";
import type { CompanyTypeDTO } from "@/lib/dto/company-type";

export function useCompanyTypes() {
  const [companyTypes, setCompanyTypes] = useState<CompanyTypeDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/company-types");
        if (!res.ok) return;
        const data = await res.json();
        setCompanyTypes(data.items ?? []);
      } catch (error) {
        console.error("Error loading company types:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getLabel = (code: string): string => {
    const type = companyTypes.find((t) => t.code === code);
    return type?.label ?? code;
  };

  return { companyTypes, loading, getLabel };
}

