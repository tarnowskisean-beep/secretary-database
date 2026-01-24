-- CreateTable
CREATE TABLE "Entity" (
    "id" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "ein" TEXT,
    "entityType" TEXT NOT NULL,
    "taxClassification" TEXT,
    "stateOfIncorporation" TEXT,
    "fiscalYearEnd" TEXT,
    "logoUrl" TEXT,
    "parentAppointsGoverningBody" BOOLEAN NOT NULL DEFAULT false,
    "supportingOrgType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityOwner" (
    "id" TEXT NOT NULL,
    "childEntityId" TEXT NOT NULL,
    "ownerEntityId" TEXT,
    "ownerPersonId" TEXT,
    "percentage" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntityOwner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "internalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonAlias" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,

    CONSTRAINT "PersonAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardRole" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "roleType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "votingRights" BOOLEAN NOT NULL DEFAULT true,
    "isCompensated" BOOLEAN NOT NULL DEFAULT false,
    "appointmentDocUrl" TEXT,
    "resignationDocUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Relationship" (
    "id" TEXT NOT NULL,
    "person1Id" TEXT NOT NULL,
    "person2Id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Relationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelatedTransaction" (
    "id" TEXT NOT NULL,
    "fromEntityId" TEXT NOT NULL,
    "toEntityId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RelatedTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Entity_ein_key" ON "Entity"("ein");

-- CreateIndex
CREATE UNIQUE INDEX "EntityOwner_childEntityId_ownerEntityId_ownerPersonId_key" ON "EntityOwner"("childEntityId", "ownerEntityId", "ownerPersonId");

-- CreateIndex
CREATE UNIQUE INDEX "Person_internalId_key" ON "Person"("internalId");

-- CreateIndex
CREATE INDEX "BoardRole_personId_idx" ON "BoardRole"("personId");

-- CreateIndex
CREATE INDEX "BoardRole_entityId_idx" ON "BoardRole"("entityId");

-- CreateIndex
CREATE INDEX "Relationship_person1Id_idx" ON "Relationship"("person1Id");

-- CreateIndex
CREATE INDEX "Relationship_person2Id_idx" ON "Relationship"("person2Id");

-- CreateIndex
CREATE INDEX "RelatedTransaction_fromEntityId_idx" ON "RelatedTransaction"("fromEntityId");

-- CreateIndex
CREATE INDEX "RelatedTransaction_toEntityId_idx" ON "RelatedTransaction"("toEntityId");

-- AddForeignKey
ALTER TABLE "EntityOwner" ADD CONSTRAINT "EntityOwner_childEntityId_fkey" FOREIGN KEY ("childEntityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityOwner" ADD CONSTRAINT "EntityOwner_ownerEntityId_fkey" FOREIGN KEY ("ownerEntityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityOwner" ADD CONSTRAINT "EntityOwner_ownerPersonId_fkey" FOREIGN KEY ("ownerPersonId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonAlias" ADD CONSTRAINT "PersonAlias_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardRole" ADD CONSTRAINT "BoardRole_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardRole" ADD CONSTRAINT "BoardRole_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_person1Id_fkey" FOREIGN KEY ("person1Id") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_person2Id_fkey" FOREIGN KEY ("person2Id") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatedTransaction" ADD CONSTRAINT "RelatedTransaction_fromEntityId_fkey" FOREIGN KEY ("fromEntityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatedTransaction" ADD CONSTRAINT "RelatedTransaction_toEntityId_fkey" FOREIGN KEY ("toEntityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
