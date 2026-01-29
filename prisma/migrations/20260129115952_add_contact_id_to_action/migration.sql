-- AlterTable
ALTER TABLE "OpportunityAction" ADD COLUMN     "contactId" UUID;

-- CreateIndex
CREATE INDEX "OpportunityAction_contactId_idx" ON "OpportunityAction"("contactId");

-- AddForeignKey
ALTER TABLE "OpportunityAction" ADD CONSTRAINT "OpportunityAction_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
