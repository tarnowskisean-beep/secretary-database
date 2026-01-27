-- CreateIndex
CREATE INDEX "Entity_legalName_idx" ON "Entity"("legalName");

-- CreateIndex
CREATE INDEX "Person_lastName_firstName_idx" ON "Person"("lastName", "firstName");
