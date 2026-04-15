-- Add userId as nullable first (required to backfill existing rows)
ALTER TABLE "Contact" ADD COLUMN "userId" UUID;

-- Backfill userId from related Company
UPDATE "Contact" SET "userId" = c."userId"
FROM "Company" c
WHERE "Contact"."companyId" = c.id;

-- Now enforce NOT NULL
ALTER TABLE "Contact" ALTER COLUMN "userId" SET NOT NULL;

-- Make companyId nullable
ALTER TABLE "Contact" ALTER COLUMN "companyId" DROP NOT NULL;

-- Drop old FK on companyId (was ON DELETE CASCADE)
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_companyId_fkey";

-- Re-add FK on companyId with ON DELETE SET NULL
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Add FK on userId → User
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Add index on userId
CREATE INDEX "Contact_userId_idx" ON "Contact"("userId");
