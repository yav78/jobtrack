export type DocumentDTO = {
  id: string;
  title: string;
  description: string | null;
  originalName: string;
  mimeType: string;
  size: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
};
