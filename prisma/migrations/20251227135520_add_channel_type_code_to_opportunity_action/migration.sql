-- AlterTable
ALTER TABLE "OpportunityAction" ADD COLUMN     "channelTypeCode" TEXT;

-- CreateIndex
CREATE INDEX "OpportunityAction_channelTypeCode_idx" ON "OpportunityAction"("channelTypeCode");
