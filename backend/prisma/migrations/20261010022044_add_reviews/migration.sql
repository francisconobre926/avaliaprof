-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reviews_targetId_idx" ON "reviews"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_chatId_authorId_key" ON "reviews"("chatId", "authorId");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
