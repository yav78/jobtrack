export type WorkOpportunityDTO = {
  id: string;
  title: string;
  description?: string | null;
  sourceUrl?: string | null;
  status: string;
  followUpAt?: string | null;
  companyId?: string | null;
  sourceLinkId?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  company?: { id: string; name: string } | null;
  sourceLink?: { id: string; title: string } | null;
};
