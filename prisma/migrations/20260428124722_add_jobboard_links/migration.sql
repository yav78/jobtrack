-- AlterTable
ALTER TABLE "OpportunityAction" ADD COLUMN     "linkId" UUID;

-- AlterTable
ALTER TABLE "WorkOpportunity" ADD COLUMN     "sourceLinkId" UUID;

-- CreateIndex
CREATE INDEX "OpportunityAction_linkId_idx" ON "OpportunityAction"("linkId");

-- CreateIndex
CREATE INDEX "WorkOpportunity_sourceLinkId_idx" ON "WorkOpportunity"("sourceLinkId");

-- AddForeignKey
ALTER TABLE "WorkOpportunity" ADD CONSTRAINT "WorkOpportunity_sourceLinkId_fkey" FOREIGN KEY ("sourceLinkId") REFERENCES "Link"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityAction" ADD CONSTRAINT "OpportunityAction_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE SET NULL ON UPDATE CASCADE;
