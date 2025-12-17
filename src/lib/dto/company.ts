export type CompanyDTO = {
  id: string;
  name: string;
  typeCode: string;
  website?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LocationDTO = {
  id: string;
  companyId: string;
  label: string;
  addressLine1: string;
  addressLine2?: string | null;
  zipCode: string;
  city: string;
  country: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};

