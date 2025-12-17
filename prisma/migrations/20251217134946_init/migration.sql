-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyType" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "CompanyType_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "ChannelType" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "ChannelType_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "typeCode" TEXT NOT NULL,
    "website" TEXT,
    "notes" TEXT,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "zipCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "roleTitle" TEXT,
    "notes" TEXT,
    "basedAtLocationId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactChannel" (
    "id" UUID NOT NULL,
    "contactId" UUID NOT NULL,
    "channelTypeCode" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOpportunity" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "companyId" UUID,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entretien" (
    "id" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,
    "workOpportunityId" UUID NOT NULL,
    "contactChannelId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entretien_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntretienContact" (
    "entretienId" UUID NOT NULL,
    "contactId" UUID NOT NULL,

    CONSTRAINT "EntretienContact_pkey" PRIMARY KEY ("entretienId","contactId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Company_userId_name_key" ON "Company"("userId", "name");

-- CreateIndex
CREATE INDEX "Location_companyId_idx" ON "Location"("companyId");

-- CreateIndex
CREATE INDEX "Contact_companyId_idx" ON "Contact"("companyId");

-- CreateIndex
CREATE INDEX "ContactChannel_contactId_idx" ON "ContactChannel"("contactId");

-- CreateIndex
CREATE INDEX "ContactChannel_channelTypeCode_idx" ON "ContactChannel"("channelTypeCode");

-- CreateIndex
CREATE INDEX "WorkOpportunity_userId_idx" ON "WorkOpportunity"("userId");

-- CreateIndex
CREATE INDEX "WorkOpportunity_companyId_idx" ON "WorkOpportunity"("companyId");

-- CreateIndex
CREATE INDEX "Entretien_userId_idx" ON "Entretien"("userId");

-- CreateIndex
CREATE INDEX "Entretien_workOpportunityId_idx" ON "Entretien"("workOpportunityId");

-- CreateIndex
CREATE INDEX "Entretien_contactChannelId_idx" ON "Entretien"("contactChannelId");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_typeCode_fkey" FOREIGN KEY ("typeCode") REFERENCES "CompanyType"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_basedAtLocationId_fkey" FOREIGN KEY ("basedAtLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactChannel" ADD CONSTRAINT "ContactChannel_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactChannel" ADD CONSTRAINT "ContactChannel_channelTypeCode_fkey" FOREIGN KEY ("channelTypeCode") REFERENCES "ChannelType"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOpportunity" ADD CONSTRAINT "WorkOpportunity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOpportunity" ADD CONSTRAINT "WorkOpportunity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entretien" ADD CONSTRAINT "Entretien_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entretien" ADD CONSTRAINT "Entretien_workOpportunityId_fkey" FOREIGN KEY ("workOpportunityId") REFERENCES "WorkOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entretien" ADD CONSTRAINT "Entretien_contactChannelId_fkey" FOREIGN KEY ("contactChannelId") REFERENCES "ContactChannel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntretienContact" ADD CONSTRAINT "EntretienContact_entretienId_fkey" FOREIGN KEY ("entretienId") REFERENCES "Entretien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntretienContact" ADD CONSTRAINT "EntretienContact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Partial unique indexes for primary flags
CREATE UNIQUE INDEX "Location_primary_per_company" ON "Location"("companyId") WHERE "isPrimary" = true;
CREATE UNIQUE INDEX "ContactChannel_primary_per_type" ON "ContactChannel"("contactId", "channelTypeCode") WHERE "isPrimary" = true;
