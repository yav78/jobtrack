-- AlterTable
ALTER TABLE "OpportunityAction" ADD COLUMN     "companyId" UUID,
ALTER COLUMN "workOpportunityId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "OpportunityAction_companyId_idx" ON "OpportunityAction"("companyId");

-- AddForeignKey
ALTER TABLE "OpportunityAction" ADD CONSTRAINT "OpportunityAction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
