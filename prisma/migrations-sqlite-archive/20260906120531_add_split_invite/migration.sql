-- CreateTable
CREATE TABLE "SplitInvite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SplitInvite_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SplitGroup" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SplitInvite_groupId_key" ON "SplitInvite"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "SplitInvite_token_key" ON "SplitInvite"("token");
