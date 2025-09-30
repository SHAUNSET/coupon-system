import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create users with explicit IDs for consistency
  const customer = await prisma.users.create({
    data: {
      email: "customer1@example.com",
      password_hash: "hash1",
      role: "customer",
    },
  });
  const shopkeeper = await prisma.users.create({
    data: {
      email: "shopkeeper@example.com",
      password_hash: "hash2",
      role: "shopkeeper",
    },
  });
  const admin = await prisma.users.create({
    data: {
      email: "admin@example.com",
      password_hash: "hash3",
      role: "admin",
    },
  });

  // Create shop
  const shop = await prisma.shops.create({
    data: {
      name: "Shop A",
      owner_id: shopkeeper.email,
    },
  });

  // Create coupon
  await prisma.coupons.create({
    data: {
      user_id: customer.email,
      shop_id: shop.id,
      expires_at: new Date("2025-12-31"),
    },
  });
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });