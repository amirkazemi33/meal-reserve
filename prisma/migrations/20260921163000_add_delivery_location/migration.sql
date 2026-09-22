-- CreateTable
CREATE TABLE "DeliveryLocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Seed default delivery location for backfill
INSERT INTO "DeliveryLocation" ("id", "title", "address", "description", "isActive", "createdAt", "updatedAt")
VALUES ('seed-delivery-central', 'مرکزی', 'محل تحویل پیش‌فرض', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lastName" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deliveryLocationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_deliveryLocationId_fkey" FOREIGN KEY ("deliveryLocationId") REFERENCES "DeliveryLocation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "id", "isActive", "name", "lastName", "passwordHash", "phone", "updatedAt", "deliveryLocationId")
SELECT "createdAt", "id", "isActive", "name", "lastName", "passwordHash", "phone", "updatedAt", 'seed-delivery-central' FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE INDEX "User_deliveryLocationId_idx" ON "User"("deliveryLocationId");

CREATE TABLE "new_Reservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "mealPeriodId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "menuItemId" TEXT,
    "deliveryLocationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reservation_mealPeriodId_fkey" FOREIGN KEY ("mealPeriodId") REFERENCES "MealPeriod" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservation_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservation_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Reservation_deliveryLocationId_fkey" FOREIGN KEY ("deliveryLocationId") REFERENCES "DeliveryLocation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Reservation" ("id", "userId", "date", "mealPeriodId", "foodId", "menuItemId", "deliveryLocationId", "status", "createdAt", "updatedAt")
SELECT "id", "userId", "date", "mealPeriodId", "foodId", "menuItemId", 'seed-delivery-central', "status", "createdAt", "updatedAt" FROM "Reservation";
DROP TABLE "Reservation";
ALTER TABLE "new_Reservation" RENAME TO "Reservation";
CREATE UNIQUE INDEX "Reservation_userId_date_mealPeriodId_key" ON "Reservation"("userId", "date", "mealPeriodId");
CREATE INDEX "Reservation_userId_idx" ON "Reservation"("userId");
CREATE INDEX "Reservation_date_idx" ON "Reservation"("date");
CREATE INDEX "Reservation_status_idx" ON "Reservation"("status");
CREATE INDEX "Reservation_foodId_idx" ON "Reservation"("foodId");
CREATE INDEX "Reservation_mealPeriodId_idx" ON "Reservation"("mealPeriodId");
CREATE INDEX "Reservation_deliveryLocationId_idx" ON "Reservation"("deliveryLocationId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
