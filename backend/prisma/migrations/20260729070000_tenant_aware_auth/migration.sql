-- Redefine Role enum as (admin, customer)
ALTER TYPE "Role" RENAME TO "Role_old";
CREATE TYPE "Role" AS ENUM ('admin', 'customer');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role" USING ("role"::text::"Role");
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'customer';
DROP TYPE "Role_old";

-- businessId is now required
ALTER TABLE "users" ALTER COLUMN "businessId" SET NOT NULL;

-- Email is unique per business, not globally
DROP INDEX "users_email_key";
CREATE UNIQUE INDEX "users_businessId_email_key" ON "users"("businessId", "email");
