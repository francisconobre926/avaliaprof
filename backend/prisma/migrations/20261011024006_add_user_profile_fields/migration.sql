-- CreateEnum
CREATE TYPE "AdvertiserType" AS ENUM ('PROPRIETARIO', 'AGENTE', 'IMOBILIARIA', 'ORGANIZACAO');

-- CreateEnum
CREATE TYPE "ContactChannel" AS ENUM ('CHAT', 'TELEFONE', 'WHATSAPP', 'EMAIL');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "advertiserType" "AdvertiserType",
ADD COLUMN     "alternatePhone" TEXT,
ADD COLUMN     "contactChannels" "ContactChannel"[] DEFAULT ARRAY['CHAT']::"ContactChannel"[],
ADD COLUMN     "photoKey" TEXT,
ADD COLUMN     "photoUrl" TEXT;
