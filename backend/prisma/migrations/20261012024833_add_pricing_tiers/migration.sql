-- AlterTable
ALTER TABLE "PricingRule" ADD COLUMN     "maxPrice" DECIMAL(14,2),
ADD COLUMN     "minPrice" DECIMAL(14,2),
ADD COLUMN     "purpose" "ListingPurpose";
