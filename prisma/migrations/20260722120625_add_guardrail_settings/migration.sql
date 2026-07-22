-- CreateTable
CREATE TABLE "GuardrailSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "minBalance" REAL NOT NULL DEFAULT 1500,
    "monthlyAllocation" REAL NOT NULL DEFAULT 3000,
    "riskComfort" TEXT NOT NULL DEFAULT 'Conservative',
    "connectCalendar" BOOLEAN NOT NULL DEFAULT true,
    "detectLifeEvents" BOOLEAN NOT NULL DEFAULT true,
    "preTripDays" INTEGER NOT NULL DEFAULT 7,
    "flagAfterDays" INTEGER NOT NULL DEFAULT 30,
    "autoTripMode" BOOLEAN NOT NULL DEFAULT true,
    "allowNegotiation" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GuardrailSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "GuardrailSettings_userId_key" ON "GuardrailSettings"("userId");
