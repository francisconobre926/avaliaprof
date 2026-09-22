-- CreateEnum
CREATE TYPE "ChatStatus" AS ENUM ('ATIVO', 'ARQUIVADO', 'BLOQUEADO', 'SUSPENSO');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXTO', 'IMAGEM', 'LOCALIZACAO', 'LINK');

-- CreateTable
CREATE TABLE "chats" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "procuradorId" TEXT NOT NULL,
    "anuncianteId" TEXT NOT NULL,
    "status" "ChatStatus" NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "MessageType" NOT NULL DEFAULT 'TEXTO',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chats_listingId_procuradorId_key" ON "chats"("listingId", "procuradorId");

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_procuradorId_fkey" FOREIGN KEY ("procuradorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_anuncianteId_fkey" FOREIGN KEY ("anuncianteId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
