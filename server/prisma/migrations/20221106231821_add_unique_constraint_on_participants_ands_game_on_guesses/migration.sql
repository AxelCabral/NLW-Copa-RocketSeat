/*
  Warnings:

  - A unique constraint covering the columns `[partipantId,gameId]` on the table `Guess` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Guess_partipantId_gameId_key" ON "Guess"("partipantId", "gameId");
