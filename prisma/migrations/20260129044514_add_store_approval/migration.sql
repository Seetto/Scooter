-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Store" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "address" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "storeFrontImageUrl" TEXT,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Store" ("address", "createdAt", "email", "id", "latitude", "longitude", "name", "password", "phoneNumber", "storeFrontImageUrl", "updatedAt") SELECT "address", "createdAt", "email", "id", "latitude", "longitude", "name", "password", "phoneNumber", "storeFrontImageUrl", "updatedAt" FROM "Store";
DROP TABLE "Store";
ALTER TABLE "new_Store" RENAME TO "Store";
CREATE UNIQUE INDEX "Store_email_key" ON "Store"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
