-- DropIndex
DROP INDEX "users_deleted_at_idx";

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");
