-- Groups are hard-deleted from now on. Remove rows that were soft-deleted
-- before dropping the column, so they don't come back as live groups.
-- `users.group_id` is cleared (SET NULL) and `group_permissions` cascade.
DELETE FROM "groups" WHERE "deleted_at" IS NOT NULL;

-- AlterTable
ALTER TABLE "groups" DROP COLUMN "deleted_at";
