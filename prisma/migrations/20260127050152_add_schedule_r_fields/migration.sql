-- AlterTable
ALTER TABLE "Entity" ADD COLUMN     "disproportionateAllocation" BOOLEAN,
ADD COLUMN     "exemptCodeSection" TEXT,
ADD COLUMN     "isGeneralPartner" BOOLEAN,
ADD COLUMN     "isSection512Controlled" BOOLEAN,
ADD COLUMN     "legalDomicile" TEXT,
ADD COLUMN     "predominantIncomeType" TEXT,
ADD COLUMN     "primaryActivity" TEXT,
ADD COLUMN     "publicCharityStatus" TEXT,
ADD COLUMN     "shareOfEndOfYearAssets" DOUBLE PRECISION,
ADD COLUMN     "shareOfTotalIncome" DOUBLE PRECISION,
ADD COLUMN     "ubtiAmount" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "email" TEXT,
ADD COLUMN     "mailingAddress" TEXT,
ADD COLUMN     "phone" TEXT;
