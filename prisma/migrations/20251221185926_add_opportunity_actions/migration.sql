-- CreateEnum
CREATE TYPE "OpportunityActionType" AS ENUM ('INTERVIEW', 'APPLIED', 'INBOUND_CONTACT', 'OUTBOUND_CONTACT', 'MESSAGE', 'CALL', 'FOLLOW_UP', 'OFFER_RECEIVED', 'OFFER_ACCEPTED', 'REJECTED', 'NOTE');

-- CreateTable
CREATE TABLE "OpportunityAction" (
    "id" UUID NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "type" "OpportunityActionType" NOT NULL,
    "notes" TEXT,
    "metadata" JSONB,
    "userId" UUID NOT NULL,
    "workOpportunityId" UUID NOT NULL,
    "contactChannelId" UUID,
    "legacyEntretienId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpportunityAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityActionContact" (
    "actionId" UUID NOT NULL,
    "contactId" UUID NOT NULL,

    CONSTRAINT "OpportunityActionContact_pkey" PRIMARY KEY ("actionId","contactId")
);

-- CreateIndex
CREATE UNIQUE INDEX "OpportunityAction_legacyEntretienId_key" ON "OpportunityAction"("legacyEntretienId");

-- CreateIndex
CREATE INDEX "OpportunityAction_userId_idx" ON "OpportunityAction"("userId");

-- CreateIndex
CREATE INDEX "OpportunityAction_workOpportunityId_idx" ON "OpportunityAction"("workOpportunityId");

-- CreateIndex
CREATE INDEX "OpportunityAction_contactChannelId_idx" ON "OpportunityAction"("contactChannelId");

-- CreateIndex
CREATE INDEX "OpportunityAction_type_occurredAt_idx" ON "OpportunityAction"("type", "occurredAt");

-- CreateIndex
CREATE INDEX "OpportunityActionContact_contactId_idx" ON "OpportunityActionContact"("contactId");

-- AddForeignKey
ALTER TABLE "OpportunityAction" ADD CONSTRAINT "OpportunityAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityAction" ADD CONSTRAINT "OpportunityAction_workOpportunityId_fkey" FOREIGN KEY ("workOpportunityId") REFERENCES "WorkOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityAction" ADD CONSTRAINT "OpportunityAction_contactChannelId_fkey" FOREIGN KEY ("contactChannelId") REFERENCES "ContactChannel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityActionContact" ADD CONSTRAINT "OpportunityActionContact_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "OpportunityAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityActionContact" ADD CONSTRAINT "OpportunityActionContact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migration des données Entretien -> OpportunityAction
-- Étape 1: Copier les entretiens vers OpportunityAction
INSERT INTO "OpportunityAction" (
    "id",
    "occurredAt",
    "type",
    "userId",
    "workOpportunityId",
    "contactChannelId",
    "legacyEntretienId",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid() as "id",
    "date" as "occurredAt",
    'INTERVIEW'::"OpportunityActionType" as "type",
    "userId",
    "workOpportunityId",
    "contactChannelId",
    "id"::TEXT as "legacyEntretienId",
    "createdAt",
    "updatedAt"
FROM "Entretien";

-- Étape 2: Copier les participants (EntretienContact -> OpportunityActionContact)
INSERT INTO "OpportunityActionContact" ("actionId", "contactId")
SELECT
    oa."id" as "actionId",
    ec."contactId"
FROM "EntretienContact" ec
INNER JOIN "OpportunityAction" oa ON oa."legacyEntretienId" = ec."entretienId"::TEXT;
