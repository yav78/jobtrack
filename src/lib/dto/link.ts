export type LinkDTO = {
  id: string;
  userId: string;
  title: string;
  url: string;
  notes: string | null;
  category: "JOBBOARD" | "TOOL" | "NETWORK" | "OTHER";
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LinkListDTO = {
  items: LinkDTO[];
  page: number;
  pageSize: number;
  total: number;
};
