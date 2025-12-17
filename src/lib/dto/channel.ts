export type ChannelTypeDTO = {
  code: string;
  label: string;
};

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

