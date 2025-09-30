import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting seed script...");
  console.log("🌱 Seeding database...");

  try {
    console.log("🔹 Creating users...");
    const customer = await prisma.users.upsert({
      where: { email: "customer1@example.com" },
      update: {},
      create: {
        email: "customer1@example.com",
        password_hash: "hash1",
        role: "customer",
      },
    });

    const shopkeeper = await prisma.users.upsert({
      where: { email: "shopkeeper@example.com" },
      update: {},
      create: {
        email: "shopkeeper@example.com",
        password_hash: "hash2",
        role: "shopkeeper",
      },
    });

    const admin = await prisma.users.upsert({
      where: { email: "admin@example.com" },
      update: {},
      create: {
        email: "admin@example.com",
        password_hash: "hash3",
        role: "admin",
      },
    });

    console.log("✅ Users created");

    console.log("🔹 Creating shop...");
    const shop = await prisma.shops.upsert({
      where: { owner_id: shopkeeper.id }, // Correct unique field
      update: {},
      create: {
        name: "Shop A",
        owner_id: shopkeeper.id,
      },
    });
    console.log("✅ Shop created");

    console.log("🔹 Creating coupon...");
    const coupon = await prisma.coupons.upsert({
      where: { id: "coupon-1" },
      update: {},
      create: {
        id: "coupon-1",
        user_id: customer.id,
        shop_id: shop.id,
        status: "pending",
        threshold: 3,
        expires_at: new Date("2025-12-31"),
      },
    });
    console.log("✅ Coupon created");

    console.log("🔹 Creating share link...");
    const shareLink = await prisma.share_links.upsert({
      where: { link_url: "http://example.com/share/coupon-1" },
      update: {},
      create: {
        coupon_id: coupon.id,
        link_url: "http://example.com/share/" + coupon.id,
      },
    });
    console.log("✅ Share link created");

    console.log("🔹 Creating click...");
    await prisma.clicks.upsert({
      where: { id: "click-1" },
      update: {},
      create: {
        id: "click-1",
        share_link_id: shareLink.id,
        clicker_ip: "123.456.789.0",
        redeemed: false,
      },
    });
    console.log("✅ Click created");

    console.log("🌱 Seeding complete!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed script error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("💤 Prisma disconnected");
  });
