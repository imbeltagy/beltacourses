import type { FileMetadata, User } from '@repo/db';

export type PublicUser = Omit<
  User,
  'hashed_password' | 'deleted_at' | 'avatar_id'
> & { avatar: Pick<FileMetadata, 'id' | 'url'> | null };

export type ListUsersResult = {
  items: PublicUser[];
  total: number;
  page: number;
  limit: number;
};
