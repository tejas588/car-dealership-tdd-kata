-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Prisma schema does not express CHECK constraints; keep them in the versioned migration.
ALTER TABLE "Vehicle"
    ADD CONSTRAINT "Vehicle_price_positive" CHECK ("price" > 0),
    ADD CONSTRAINT "Vehicle_quantity_nonnegative" CHECK ("quantity" >= 0),
    ADD CONSTRAINT "Vehicle_make_nonempty" CHECK (btrim("make") <> ''),
    ADD CONSTRAINT "Vehicle_model_nonempty" CHECK (btrim("model") <> ''),
    ADD CONSTRAINT "Vehicle_category_nonempty" CHECK (btrim("category") <> '');
