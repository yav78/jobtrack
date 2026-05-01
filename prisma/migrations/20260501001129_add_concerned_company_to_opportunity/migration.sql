-- AlterTable
ALTER TABLE "WorkOpportunity" ADD COLUMN     "concernedCompanyId" UUID;

-- CreateIndex
CREATE INDEX "WorkOpportunity_concernedCompanyId_idx" ON "WorkOpportunity"("concernedCompanyId");

-- AddForeignKey
ALTER TABLE "WorkOpportunity" ADD CONSTRAINT "WorkOpportunity_concernedCompanyId_fkey" FOREIGN KEY ("concernedCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
