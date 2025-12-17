export type ContactChannelDTO = {
  id: string;
  contactId: string;
  channelTypeCode: string;
  value: string;
  label?: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ContactDTO = {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  roleTitle?: string | null;
  notes?: string | null;
  basedAtLocationId?: string | null;
  createdAt: string;
  updatedAt: string;
  channels?: ContactChannelDTO[];
};

