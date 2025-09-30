/*
  Warnings:

  - The primary key for the `clicks` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `coupons` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `redemptions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `redeemed_at` on the `redemptions` table. All the data in the column will be lost.
  - The primary key for the `share_links` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `link` on the `share_links` table. All the data in the column will be lost.
  - The primary key for the `shops` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[link_url]` on the table `share_links` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[owner_id]` on the table `shops` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `clicker_ip` to the `clicks` table without a default value. This is not possible if the table is not empty.
  - Made the column `clicked_at` on table `clicks` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `confirmed_at` to the `redemptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `redeemer_id` to the `redemptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopkeeper_id` to the `redemptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `link_url` to the `share_links` table without a default value. This is not possible if the table is not empty.
  - Made the column `created_at` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."clicks" DROP CONSTRAINT "clicks_share_link_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."coupons" DROP CONSTRAINT "coupons_shop_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."coupons" DROP CONSTRAINT "coupons_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."redemptions" DROP CONSTRAINT "redemptions_coupon_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."share_links" DROP CONSTRAINT "share_links_coupon_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."shops" DROP CONSTRAINT "shops_owner_id_fkey";

-- AlterTable
ALTER TABLE "clicks" DROP CONSTRAINT "clicks_pkey",
ADD COLUMN     "clicker_ip" TEXT NOT NULL,
ADD COLUMN     "redeemed" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "share_link_id" SET DATA TYPE TEXT,
ALTER COLUMN "clicked_at" SET NOT NULL,
ALTER COLUMN "clicked_at" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "clicks_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "coupons" DROP CONSTRAINT "coupons_pkey",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "threshold" INTEGER NOT NULL DEFAULT 3,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ALTER COLUMN "shop_id" SET DATA TYPE TEXT,
ALTER COLUMN "expires_at" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "coupons_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "redemptions" DROP CONSTRAINT "redemptions_pkey",
DROP COLUMN "redeemed_at",
ADD COLUMN     "confirmed_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "redeemer_id" TEXT NOT NULL,
ADD COLUMN     "shopkeeper_id" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "coupon_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "redemptions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "share_links" DROP CONSTRAINT "share_links_pkey",
DROP COLUMN "link",
ADD COLUMN     "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "link_url" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "coupon_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "share_links_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "shops" DROP CONSTRAINT "shops_pkey",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "name" SET DATA TYPE TEXT,
ALTER COLUMN "owner_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "shops_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "email" SET DATA TYPE TEXT,
ALTER COLUMN "password_hash" SET DATA TYPE TEXT,
ALTER COLUMN "role" SET DEFAULT 'customer',
ALTER COLUMN "role" SET DATA TYPE TEXT,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "share_links_link_url_key" ON "share_links"("link_url");

-- CreateIndex
CREATE UNIQUE INDEX "shops_owner_id_key" ON "shops"("owner_id");

-- AddForeignKey
ALTER TABLE "shops" ADD CONSTRAINT "shops_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_share_link_id_fkey" FOREIGN KEY ("share_link_id") REFERENCES "share_links"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_redeemer_id_fkey" FOREIGN KEY ("redeemer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_shopkeeper_id_fkey" FOREIGN KEY ("shopkeeper_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
