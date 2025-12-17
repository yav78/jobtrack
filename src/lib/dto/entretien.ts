export type EntretienDTO = {
  id: string;
  date: string;
  userId: string;
  workOpportunityId: string;
  contactChannelId: string;
  createdAt: string;
  updatedAt: string;
  contacts?: { contactId: string }[];
};

