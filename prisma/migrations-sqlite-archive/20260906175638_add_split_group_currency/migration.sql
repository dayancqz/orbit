-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SplitGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SGD',
    "exchangeRateToSGD" REAL NOT NULL DEFAULT 1,
    "rateUpdatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SplitGroup_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SplitGroup" ("createdAt", "createdById", "id", "name") SELECT "createdAt", "createdById", "id", "name" FROM "SplitGroup";
DROP TABLE "SplitGroup";
ALTER TABLE "new_SplitGroup" RENAME TO "SplitGroup";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
