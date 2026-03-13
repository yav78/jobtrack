-- CreateEnum
CREATE TYPE "WorkOpportunityStatus" AS ENUM ('SOURCING', 'APPLIED', 'INTERVIEW', 'OFFER_RECEIVED', 'OFFER_ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "WorkOpportunity" ADD COLUMN     "followUpAt" TIMESTAMP(3),
ADD COLUMN     "status" "WorkOpportunityStatus" NOT NULL DEFAULT 'SOURCING';

-- CreateIndex
CREATE INDEX "WorkOpportunity_status_idx" ON "WorkOpportunity"("status");

-- CreateIndex
CREATE INDEX "WorkOpportunity_followUpAt_idx" ON "WorkOpportunity"("followUpAt");
