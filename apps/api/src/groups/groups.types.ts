export type PublicGroup = {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  users_count: number;
  created_at: Date;
  updated_at: Date;
};

export type ListGroupsResult = {
  items: PublicGroup[];
  total: number;
  page: number;
  limit: number;
};
