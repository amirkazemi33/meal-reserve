-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Food" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'MAIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Food" ("createdAt", "description", "id", "isActive", "title", "updatedAt") SELECT "createdAt", "description", "id", "isActive", "title", "updatedAt" FROM "Food";
DROP TABLE "Food";
ALTER TABLE "new_Food" RENAME TO "Food";
CREATE INDEX "Food_kind_idx" ON "Food"("kind");
CREATE TABLE "new_Reservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "mealPeriodId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "menuItemId" TEXT,
    "drinkFoodId" TEXT,
    "drinkMenuItemId" TEXT,
    "sideFoodId" TEXT,
    "sideMenuItemId" TEXT,
    "deliveryLocationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reservation_mealPeriodId_fkey" FOREIGN KEY ("mealPeriodId") REFERENCES "MealPeriod" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservation_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservation_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Reservation_drinkFoodId_fkey" FOREIGN KEY ("drinkFoodId") REFERENCES "Food" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Reservation_drinkMenuItemId_fkey" FOREIGN KEY ("drinkMenuItemId") REFERENCES "MenuItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Reservation_sideFoodId_fkey" FOREIGN KEY ("sideFoodId") REFERENCES "Food" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Reservation_sideMenuItemId_fkey" FOREIGN KEY ("sideMenuItemId") REFERENCES "MenuItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Reservation_deliveryLocationId_fkey" FOREIGN KEY ("deliveryLocationId") REFERENCES "DeliveryLocation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Reservation" ("createdAt", "date", "deliveryLocationId", "foodId", "id", "mealPeriodId", "menuItemId", "status", "updatedAt", "userId") SELECT "createdAt", "date", "deliveryLocationId", "foodId", "id", "mealPeriodId", "menuItemId", "status", "updatedAt", "userId" FROM "Reservation";
DROP TABLE "Reservation";
ALTER TABLE "new_Reservation" RENAME TO "Reservation";
CREATE INDEX "Reservation_userId_idx" ON "Reservation"("userId");
CREATE INDEX "Reservation_date_idx" ON "Reservation"("date");
CREATE INDEX "Reservation_status_idx" ON "Reservation"("status");
CREATE INDEX "Reservation_foodId_idx" ON "Reservation"("foodId");
CREATE INDEX "Reservation_mealPeriodId_idx" ON "Reservation"("mealPeriodId");
CREATE INDEX "Reservation_deliveryLocationId_idx" ON "Reservation"("deliveryLocationId");
CREATE INDEX "Reservation_drinkFoodId_idx" ON "Reservation"("drinkFoodId");
CREATE INDEX "Reservation_sideFoodId_idx" ON "Reservation"("sideFoodId");
CREATE UNIQUE INDEX "Reservation_userId_date_mealPeriodId_key" ON "Reservation"("userId", "date", "mealPeriodId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
