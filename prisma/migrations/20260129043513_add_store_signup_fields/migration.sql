/*
  Warnings:

  - Added the required column `email` to the `Store` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `Store` table without a default value. This is not possible if the table is not empty.

*/
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Store" ("address", "createdAt", "id", "latitude", "longitude", "name", "updatedAt") SELECT "address", "createdAt", "id", "latitude", "longitude", "name", "updatedAt" FROM "Store";
DROP TABLE "Store";
ALTER TABLE "new_Store" RENAME TO "Store";
CREATE UNIQUE INDEX "Store_email_key" ON "Store"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
